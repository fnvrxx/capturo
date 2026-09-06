<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OcrPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_preview_preserves_page_geometry_and_line_confidence_alongside_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $template = $user->templates()->create(['name' => 'Test document']);
        $template->fields()->create(['name' => 'Nama', 'type' => 'text', 'order' => 0]);
        $line = ['id' => '0-0', 'page_index' => 0, 'text' => 'Nama: Fajar', 'confidence' => 0.976, 'bbox' => [[10, 20], [80, 20], [80, 40], [10, 40]]];
        $pages = [
            ['page_index' => 0, 'width' => 100, 'height' => 200, 'image' => 'data:image/jpeg;base64,test', 'lines' => [$line]],
            ['page_index' => 1, 'width' => 200, 'height' => 100, 'image' => 'data:image/jpeg;base64,test', 'lines' => []],
        ];
        config()->set('services.paddle_ocr', ['url' => 'https://ocr.example.test', 'token' => 'test-token']);
        Http::fake(['https://ocr.example.test/ocr' => Http::response(['lines' => [$line], 'pages' => $pages])]);

        $this->postJson('/api/ocr/process', ['template_id' => $template->id, 'image' => UploadedFile::fake()->image('document.png')])
            ->assertOk()
            ->assertJsonPath('data.raw_fields.Nama', 'Fajar')
            ->assertJsonPath('data.ocr_lines.0.confidence', 0.976)
            ->assertJsonPath('data.ocr_pages', $pages);
    }

    public function test_legacy_service_still_returns_boxes_without_page_rasters(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $template = $user->templates()->create(['name' => 'Legacy service']);
        config()->set('services.paddle_ocr', ['url' => 'https://ocr.example.test', 'token' => 'test-token']);
        Http::fake(['https://ocr.example.test/ocr' => Http::response(['lines' => [['text' => 'Fajar', 'confidence' => 0.9, 'bbox' => [0, 0, 100, 20]]]])]);
        $this->postJson('/api/ocr/process', ['template_id' => $template->id, 'image' => UploadedFile::fake()->image('document.png')])
            ->assertOk()->assertJsonPath('data.ocr_pages', [])->assertJsonPath('data.ocr_lines.0.bbox', [0, 0, 100, 20]);
    }
}
