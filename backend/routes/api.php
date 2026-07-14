<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/posts/me', [PostController::class, 'me']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/feed', [FeedController::class, 'index']);
    Route::get('/search', [FeedController::class, 'search']);
    Route::post('/interactions', [FeedController::class, 'interact']);
});
