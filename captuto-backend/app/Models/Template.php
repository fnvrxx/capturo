<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Template extends Model
{
    protected $fillable = ['user_id', 'name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fields(): HasMany
    {
        return $this->hasMany(Field::class)->orderBy('order');
    }

    public function records(): HasMany
    {
        return $this->hasMany(Record::class);
    }
}
