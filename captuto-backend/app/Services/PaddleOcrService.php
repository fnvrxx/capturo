<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class PaddleOcrService
{
    public function analyze(UploadedFile $file): array
    {
        $baseUrl = rtrim(trim((string) config('services.paddle_ocr.url')), '/');
        $token = (string) config('services.paddle_ocr.token');

        if (empty($baseUrl) || empty($token)) {
            throw new RuntimeException('Layanan PaddleOCR belum dikonfigurasi.');
        }

        $url = $baseUrl.'/ocr';

        try {
            $response = Http::connectTimeout(10)
                ->timeout((int) config('services.paddle_ocr.timeout', 90))
                ->acceptJson()
                ->withToken($token)
                ->attach(
                    'file',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName(),
                    ['Content-Type' => $file->getMimeType() ?: 'application/octet-stream']
                )
                ->post($url);
        } catch (ConnectionException $e) {
            Log::warning('PaddleOCR connection failed', ['url' => $url]);
            throw new RuntimeException('Koneksi PaddleOCR gagal atau melewati batas waktu. Periksa server Kaggle dan tunnel zrok.', 0, $e);
        }

        if (! $response->successful()) {
            Log::error('PaddleOCR request failed', [
                'status' => $response->status(),
                'url' => $url,
            ]);

            $message = match ($response->status()) {
                401, 403 => 'Akses PaddleOCR ditolak. Pastikan PADDLE_OCR_TOKEN Laravel dan Kaggle sama.',
                404 => 'Endpoint PaddleOCR tidak ditemukan (HTTP 404). Periksa URL zrok aktif dan endpoint /ocr.',
                413 => 'Dokumen melebihi batas ukuran yang diterima PaddleOCR.',
                415 => 'Format dokumen ditolak PaddleOCR. Gunakan JPG, PNG, atau PDF.',
                502, 503, 504 => 'Gateway PaddleOCR tidak dapat menjangkau layanan (HTTP '.$response->status().'). Periksa server Kaggle pada port 8000 dan tunnel zrok.',
                default => 'Layanan PaddleOCR gagal memproses dokumen (HTTP '.$response->status().'). Periksa log PaddleOCR di Kaggle.',
            };
            throw new RuntimeException($message);
        }

        $payload = $response->json();
        if (! is_array($payload) || ! is_array($payload['lines'] ?? null)) {
            throw new RuntimeException('Layanan PaddleOCR mengembalikan format hasil yang tidak valid.');
        }

        return $payload;
    }

    /** @return array{0: array<string, string>, 1: array<string, float>} */
    public function extractFields(array $result, Collection $fields): array
    {
        $lines = collect($result['lines'])
            ->filter(fn ($line) => is_array($line) && filled($line['text'] ?? null))
            ->map(fn ($line) => [
                'text' => trim((string) $line['text']),
                'confidence' => max(0, min(1, (float) ($line['confidence'] ?? 0))),
            ])
            ->values();

        $rawFields = [];
        $confidences = [];

        foreach ($fields as $field) {
            [$value, $confidence] = $this->findValue($field->name, $lines);
            $rawFields[$field->name] = $value;
            $confidences[$field->name] = $confidence;
        }

        return [$rawFields, $confidences];
    }

    /** @return array{0: string, 1: float} */
    private function findValue(string $fieldName, Collection $lines): array
    {
        $normalizedField = $this->normalize($fieldName);

        foreach ($lines as $index => $line) {
            $normalizedLine = $this->normalize($line['text']);
            if (! str_contains($normalizedLine, $normalizedField)) {
                continue;
            }

            $value = $this->valueAfterLabel($line['text'], $fieldName);
            if ($value !== '') {
                return [$value, $line['confidence']];
            }

            $nextLine = $lines->get($index + 1);
            if ($nextLine) {
                return [$nextLine['text'], min($line['confidence'], $nextLine['confidence'])];
            }
        }

        return ['', 0.0];
    }

    private function valueAfterLabel(string $line, string $label): string
    {
        $parts = preg_split('/'.preg_quote($label, '/').'\s*[:\-]\s*/iu', $line, 2);

        return isset($parts[1]) ? trim($parts[1]) : '';
    }

    private function normalize(string $value): string
    {
        return preg_replace('/\s+/u', ' ', mb_strtolower(trim($value))) ?? '';
    }
}
