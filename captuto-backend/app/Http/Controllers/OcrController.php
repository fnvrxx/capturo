<?php

namespace App\Http\Controllers;

use App\Services\PaddleOcrService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class OcrController extends Controller
{
    use ApiResponse;

    public function __construct(protected PaddleOcrService $paddleOcr) {}

    public function process(Request $request): JsonResponse
    {
        $request->validate([
            'image'       => 'required|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'template_id' => 'required|integer|exists:templates,id',
        ]);

        $template = $request->user()->templates()->with('fields')->findOrFail($request->template_id);
        $fields   = $template->fields;

        try {
            $analyzeResult = $this->paddleOcr->analyze($request->file('image'));
            [$rawFields, $confidences] = $this->paddleOcr->extractFields($analyzeResult, $fields);
        } catch (\RuntimeException $e) {
            Log::error('PaddleOCR error', ['message' => $e->getMessage()]);

            return $this->error($e->getMessage(), 502);
        }

        return $this->success(
            $this->buildResponse($template->name, $rawFields, $confidences, $analyzeResult)
        );
    }

    private function buildResponse(string $templateName, array $rawFields, array $confidences, array $analysis): array
    {
        return [
            'template'          => $templateName,
            'scanned_at'        => now()->toISOString(),
            'status'            => 'processed',
            'document_image'    => null,
            'raw_fields'        => $rawFields,
            'confidence_scores' => $confidences,
            'ocr_lines'         => $analysis['lines'],
            'ocr_pages'         => $analysis['pages'] ?? [],
        ];
    }

}
