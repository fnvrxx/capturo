<?php

namespace App\Http\Requests\Record;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'template_id'       => 'required|integer|exists:templates,id',
            'scanned_at'        => 'required|date',
            'raw_json'          => 'required|array',
            'data'              => 'required|array',
            'confidence_scores' => 'required|array',
            'document_image'    => 'nullable|string',
        ];
    }
}
