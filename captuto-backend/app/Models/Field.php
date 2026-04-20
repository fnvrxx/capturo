<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Field extends Model
{
    protected $fillable = ['template_id', 'name', 'type', 'order'];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }
}
