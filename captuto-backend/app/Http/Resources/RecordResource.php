<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'template_id'       => $this->template_id,
            'scanned_at'        => $this->scanned_at->toISOString(),
            'document_image'    => $this->document_image,
            'raw_json'          => $this->raw_json,
            'data'              => $this->data,
            'confidence_scores' => $this->confidence_scores,
            'created_at'        => $this->created_at->toISOString(),
        ];
    }
}
