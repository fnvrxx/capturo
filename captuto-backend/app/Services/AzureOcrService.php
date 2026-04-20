<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AzureOcrService
{
    protected string $endpoint;
    protected string $key;

    public function __construct()
    {
        $this->endpoint = rtrim(config('services.azure_ocr.endpoint', ''), '/');
        $this->key      = config('services.azure_ocr.key', '');
    }

    public function isConfigured(): bool
    {
        return !empty($this->endpoint) && !empty($this->key);
    }

    /**
     * Submit dokumen ke Azure Document Intelligence dan tunggu hasilnya.
     * Azure menggunakan pola asinkron: submit → dapat operation URL → polling hasil.
     *
     * @param string $imagePath Path relatif dari storage/app/
     * @return array Raw hasil analisis dari Azure
     */
    public function analyze(string $imagePath): array
    {
        $fullPath = storage_path('app/private/' . $imagePath);
        if (!file_exists($fullPath)) {
            // Fallback: Laravel 11 kadang simpan tanpa subfolder 'private'
            $fullPath = storage_path('app/' . $imagePath);
        }

        if (!file_exists($fullPath)) {
            throw new RuntimeException("File tidak ditemukan di storage: {$imagePath}");
        }

        $imageBytes = file_get_contents($fullPath);
        $mimeType   = mime_content_type($fullPath);

        // Step 1: Submit dokumen ke Azure, dapatkan operation URL
        $operationUrl = $this->submitDocument($imageBytes, $mimeType);

        // Step 2: Polling sampai analisis selesai (maks 60 detik)
        $result = $this->pollForResult($operationUrl);

        return $result;
    }

    /**
     * Kirim dokumen ke Azure dan kembalikan operation-location URL untuk polling.
     */
    private function submitDocument(string $imageBytes, string $mimeType): string
    {
        $url = "{$this->endpoint}/documentintelligence/documentModels/prebuilt-read:analyze"
             . "?api-version=2024-11-30";

        $response = Http::withHeaders([
            'Ocp-Apim-Subscription-Key' => $this->key,
            'Content-Type'              => $mimeType,
        ])->withBody($imageBytes, $mimeType)->post($url);

        if ($response->status() !== 202) {
            Log::error('Azure OCR submit failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new RuntimeException(
                'Azure OCR gagal menerima dokumen. Status: ' . $response->status()
                . ' — ' . ($response->json('error.message') ?? $response->body())
            );
        }

        $operationUrl = $response->header('Operation-Location');

        if (empty($operationUrl)) {
            throw new RuntimeException('Azure OCR tidak mengembalikan Operation-Location header.');
        }

        return $operationUrl;
    }

    /**
     * Polling operation URL sampai status "succeeded" atau timeout.
     * Azure biasanya selesai dalam 2-10 detik untuk dokumen sederhana.
     */
    private function pollForResult(string $operationUrl, int $maxAttempts = 20, int $intervalMs = 2000): array
    {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            usleep($intervalMs * 1000); // tunggu sebelum cek (dalam microseconds)

            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->key,
            ])->get($operationUrl);

            if (!$response->ok()) {
                throw new RuntimeException('Azure OCR polling gagal. Status: ' . $response->status());
            }

            $body   = $response->json();
            $status = $body['status'] ?? 'unknown';

            if ($status === 'succeeded') {
                return $body['analyzeResult'] ?? [];
            }

            if ($status === 'failed') {
                $errorMsg = $body['error']['message'] ?? 'Unknown error';
                Log::error('Azure OCR analysis failed', ['body' => $body]);
                throw new RuntimeException('Azure OCR gagal menganalisis dokumen: ' . $errorMsg);
            }

            // status 'running' atau 'notStarted' → lanjut polling
            Log::info("Azure OCR polling attempt {$attempt}/{$maxAttempts}, status: {$status}");
        }

        throw new RuntimeException('Azure OCR timeout: dokumen tidak selesai diproses dalam batas waktu.');
    }

    /**
     * Ekstrak nilai field dari hasil Azure berdasarkan nama field template.
     * Azure prebuilt-read mengembalikan teks bebas, bukan field terstruktur.
     * Untuk field terstruktur, gunakan model prebuilt-invoice, prebuilt-receipt, dll.
     *
     * @param array $analyzeResult Hasil dari $this->analyze()
     * @param \Illuminate\Support\Collection $fields Field-field dari template
     * @return array [rawFields, confidences]
     */
    public function extractFields(array $analyzeResult, $fields): array
    {
        // Kumpulkan semua konten teks dari Azure (per baris/paragraf)
        $pages      = $analyzeResult['pages'] ?? [];
        $paragraphs = $analyzeResult['paragraphs'] ?? [];

        // Buat daftar semua teks yang ditemukan beserta confidence-nya
        $allLines = [];
        foreach ($pages as $page) {
            foreach ($page['lines'] ?? [] as $line) {
                $allLines[] = [
                    'text'       => $line['content'] ?? '',
                    'confidence' => $line['spans'][0]['confidence'] ?? null,
                ];
            }
        }

        $rawFields   = [];
        $confidences = [];

        foreach ($fields as $field) {
            // Cari baris yang paling relevan dengan nama field ini
            $match = $this->findBestMatch($field->name, $allLines);

            if ($match) {
                $rawFields[$field->name]   = $match['text'];
                $confidences[$field->name] = round($match['confidence'] ?? 0.85, 4);
            } else {
                // Tidak ditemukan: gunakan semua teks gabungan sebagai fallback
                $rawFields[$field->name]   = $this->getAllText($analyzeResult);
                $confidences[$field->name] = 0.3;
            }
        }

        return [$rawFields, $confidences];
    }

    /**
     * Cari baris teks yang paling mungkin berisi nilai untuk field tertentu.
     * Strategi sederhana: cari baris setelah baris yang mengandung nama field.
     */
    private function findBestMatch(string $fieldName, array $lines): ?array
    {
        $fieldLower = strtolower($fieldName);

        foreach ($lines as $i => $line) {
            $lineLower = strtolower($line['text']);

            // Jika baris ini adalah label field, nilai biasanya ada di baris berikutnya
            if (str_contains($lineLower, $fieldLower)) {
                $nextLine = $lines[$i + 1] ?? null;
                if ($nextLine && !empty(trim($nextLine['text']))) {
                    return $nextLine;
                }
                // Atau mungkin nilai ada setelah tanda ':' di baris yang sama
                if (str_contains($line['text'], ':')) {
                    $parts = explode(':', $line['text'], 2);
                    $value = trim($parts[1] ?? '');
                    if (!empty($value)) {
                        return ['text' => $value, 'confidence' => $line['confidence'] ?? 0.7];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Gabungkan semua teks dari hasil analisis menjadi satu string.
     */
    private function getAllText(array $analyzeResult): string
    {
        return $analyzeResult['content'] ?? '';
    }
}
