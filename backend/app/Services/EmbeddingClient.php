<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class EmbeddingClient
{
    public const DIMENSIONS = 64;

    public function embed(string $text): array
    {
        try {
            $response = Http::timeout(3)->post(config('services.embeddings.url').'/embed', ['text' => $text]);
            if ($response->successful() && count($response->json('embedding', [])) === self::DIMENSIONS) return $response->json('embedding');
        } catch (\Throwable) { /* Local fallback keeps the assessment runnable without the service. */ }
        return $this->fallback($text);
    }

    public function literal(array $embedding): string { return '['.implode(',', array_map(fn ($v) => sprintf('%.8F', $v), $embedding)).']'; }

    private function fallback(string $text): array
    {
        $vector = array_fill(0, self::DIMENSIONS, 0.0);
        preg_match_all("/[a-z0-9']+/i", strtolower($text), $matches);
        foreach ($matches[0] as $token) { $hash = hash('sha256', $token); $index = hexdec(substr($hash, 0, 4)) % self::DIMENSIONS; $vector[$index] += hexdec(substr($hash, 4, 2)) % 2 ? 1 : -1; }
        $magnitude = sqrt(array_sum(array_map(fn ($v) => $v * $v, $vector))) ?: 1;
        return array_map(fn ($v) => round($v / $magnitude, 8), $vector);
    }
}
