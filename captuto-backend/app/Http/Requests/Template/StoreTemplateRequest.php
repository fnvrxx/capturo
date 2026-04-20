<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'fields'        => 'required|array|min:1',
            'fields.*.name' => 'required|string|max:255',
            'fields.*.type' => 'required|in:text,number,date,currency,email',
        ];
    }
}
