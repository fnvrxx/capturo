<?php

namespace Tests\Unit;

use App\Models\Field;
use App\Services\PaddleOcrService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class PaddleOcrServiceTest extends TestCase
{
    public function test_it_forwards_the_document_to_the_paddle_service(): void
    {
        config()->set('services.paddle_ocr', [
            'url' => ' https://ocr.example.test/ ',
            'token' => 'test-token',
            'timeout' => 90,
        ]);

        Http::fake([
            'https://ocr.example.test/ocr' => Http::response([
                'lines' => [['text' => 'Nama: Budi', 'confidence' => 0.98, 'bbox' => []]],
            ]),
        ]);

        $service = app(PaddleOcrService::class);
        $result = $service->analyze(UploadedFile::fake()->createWithContent('document.png', 'image-data'));

        $this->assertSame('Nama: Budi', $result['lines'][0]['text']);
        Http::assertSent(fn ($request) => $request->url() === 'https://ocr.example.test/ocr'
            && $request->hasHeader('Authorization', 'Bearer test-token'));
    }

    public function test_it_extracts_values_from_a_label_or_following_line(): void
    {
        $fields = new Collection([
            new Field(['name' => 'Nama']),
            new Field(['name' => 'Nomor Invoice']),
            new Field(['name' => 'Email']),
        ]);

        [$values, $confidence] = app(PaddleOcrService::class)->extractFields([
            'lines' => [
                ['text' => 'Nama: Budi Santoso', 'confidence' => 0.97],
                ['text' => 'Nomor Invoice', 'confidence' => 0.93],
                ['text' => 'INV-2026-001', 'confidence' => 0.91],
            ],
        ], $fields);

        $this->assertSame('Budi Santoso', $values['Nama']);
        $this->assertSame('INV-2026-001', $values['Nomor Invoice']);
        $this->assertSame('', $values['Email']);
        $this->assertSame(0.0, $confidence['Email']);
    }

    public function test_it_explains_gateway_and_authentication_failures(): void
    {
        config()->set('services.paddle_ocr', ['url' => 'https://ocr.example.test', 'token' => 'test-token', 'timeout' => 90]);
        Http::fake(['https://ocr.example.test/ocr' => Http::sequence()
            ->push('bad gateway', 502)->push('Unauthorized', 401)->push('Not found', 404)]);
        foreach ([502 => 'port 8000', 401 => 'PADDLE_OCR_TOKEN', 404 => 'URL zrok aktif'] as $status => $expected) {
            try {
                app(PaddleOcrService::class)->analyze(UploadedFile::fake()->createWithContent('document.png', 'image-data'));
                $this->fail('Expected an OCR exception.');
            } catch (RuntimeException $e) {
                $this->assertStringContainsString($expected, $e->getMessage());
            }
        }
    }

    public function test_connection_failures_provide_a_useful_error(): void
    {
        config()->set('services.paddle_ocr', ['url' => 'https://ocr.example.test', 'token' => 'test-token', 'timeout' => 90]);
        Http::fake(fn () => throw new ConnectionException('Connection refused'));
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Periksa server Kaggle dan tunnel zrok');
        app(PaddleOcrService::class)->analyze(UploadedFile::fake()->createWithContent('document.png', 'image-data'));
    }
}
