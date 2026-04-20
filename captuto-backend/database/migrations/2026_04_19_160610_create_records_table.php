<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('scanned_at');
            $table->string('document_image')->nullable();
            $table->jsonb('raw_json');
            $table->jsonb('data');
            $table->jsonb('confidence_scores');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('records');
    }
};
