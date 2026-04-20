<?php

namespace App\Http\Controllers;

use App\Services\AzureOcrService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OcrController extends Controller
{
    use ApiResponse;

    public function __construct(protected AzureOcrService $azure) {}

    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'image'       => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'template_id' => 'required|integer|exists:templates,id',
        ]);

        $template = $request->user()->templates()->with('fields')->findOrFail($request->template_id);
        $fields   = $template->fields;

        $userId = $request->user()->id;
        $path   = $request->file('image')->store("ocr_uploads/{$userId}");

        if ($this->azure->isConfigured()) {
            try {
                $analyzeResult             = $this->azure->analyze($path);
                [$rawFields, $confidences] = $this->azure->extractFields($analyzeResult, $fields);
            } catch (\RuntimeException $e) {
                Log::error('Azure OCR error', ['message' => $e->getMessage()]);
                // Fallback ke simulasi jika Azure gagal, agar alur tidak putus
                [$rawFields, $confidences] = $this->simulateOcr($fields);
                return $this->success(
                    $this->buildResponse($template->name, $path, $rawFields, $confidences),
                    'Azure tidak tersedia, menggunakan hasil simulasi'
                );
            }
        } else {
            [$rawFields, $confidences] = $this->simulateOcr($fields);
        }

        return $this->success(
            $this->buildResponse($template->name, $path, $rawFields, $confidences)
        );
    }

    private function buildResponse(string $templateName, string $path, array $rawFields, array $confidences): array
    {
        return [
            'template'          => $templateName,
            'scanned_at'        => now()->toISOString(),
            'status'            => 'pending_confirmation',
            'document_image'    => $path,
            'raw_fields'        => $rawFields,
            'confidence_scores' => $confidences,
        ];
    }

    private function simulateOcr($fields): array
    {
        $rawFields   = [];
        $confidences = [];
        $fieldArray  = $fields->toArray();
        shuffle($fieldArray);
        $total = count($fieldArray);

        foreach ($fieldArray as $i => $field) {
            if ($i === 0) {
                $conf = mt_rand(20, 45) / 100;
            } elseif ($i <= 2 && $total > 1) {
                $conf = mt_rand(50, 78) / 100;
            } else {
                $conf = mt_rand(80, 99) / 100;
            }
            $confidences[$field['name']] = $conf;
        }

        foreach ($fields as $field) {
            $conf                    = $confidences[$field->name];
            $suffix                  = $conf < 0.5 ? ' ?' : '';
            $rawFields[$field->name] = $this->generateFakeValue($field->type) . $suffix;
        }

        return [$rawFields, $confidences];
    }

    private function generateFakeValue(string $type): string
    {
        return match ($type) {
            'number'   => (string) mt_rand(1, 100),
            'date'     => now()->format('d F Y'),
            'currency' => 'Rp ' . number_format(mt_rand(1, 20) * 250000, 0, ',', '.'),
            'email'    => 'vendor@example.com',
            default    => 'Sample Text Value',
        };
    }
}
