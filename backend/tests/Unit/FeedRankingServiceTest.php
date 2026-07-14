<?php

namespace Tests\Unit;

use App\Services\EmbeddingClient;
use App\Services\FeedRankingService;
use Tests\TestCase;

class FeedRankingServiceTest extends TestCase
{
    public function test_authenticity_penalizes_engagement_bait_without_zeroing_it(): void
    {
        $service = app(FeedRankingService::class);
        $this->assertGreaterThan($service->authenticity('LOOK!!! #viral #follow https://example.test'), $service->authenticity('A calm walk home after rain.'));
    }

    public function test_fallback_embeddings_are_stable_and_normalized(): void
    {
        $client = app(EmbeddingClient::class);
        $first = $client->embed('funny travel stories from last week');
        $this->assertSame($first, $client->embed('funny travel stories from last week'));
        $this->assertCount(EmbeddingClient::DIMENSIONS, $first);
        $this->assertEqualsWithDelta(1.0, array_sum(array_map(fn ($v) => $v * $v, $first)), 0.00001);
    }
}
