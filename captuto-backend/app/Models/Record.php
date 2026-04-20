<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Record extends Model
{
    protected $fillable = [
        'template_id', 'user_id', 'scanned_at',
        'document_image', 'raw_json', 'data', 'confidence_scores',
    ];

    protected $casts = [
        'raw_json'          => 'array',
        'data'              => 'array',
        'confidence_scores' => 'array',
        'scanned_at'        => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
