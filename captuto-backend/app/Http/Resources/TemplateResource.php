<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'name'          => $this->name,
            'description'   => $this->description,
            'is_active'     => $this->is_active,
            'records_count' => $this->records_count ?? 0,
            'fields'        => FieldResource::collection($this->whenLoaded('fields')),
            'created_at'    => $this->created_at->toISOString(),
        ];
    }
}
