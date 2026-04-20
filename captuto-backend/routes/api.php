<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\OcrController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    Route::get('/templates',        [TemplateController::class, 'index']);
    Route::post('/templates',       [TemplateController::class, 'store']);
    Route::get('/templates/{id}',   [TemplateController::class, 'show']);
    Route::delete('/templates/{id}',[TemplateController::class, 'destroy']);

    Route::get('/records',                       [RecordController::class, 'index']);
    Route::post('/records',                      [RecordController::class, 'store']);
    Route::get('/records/export/{template_id}',  [RecordController::class, 'export']);

    Route::post('/ocr/process', [OcrController::class, 'process']);
});
