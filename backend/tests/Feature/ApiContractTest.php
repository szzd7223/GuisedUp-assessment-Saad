<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use App\Models\Interaction;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use DatabaseTransactions;

    public function test_protected_feed_rejects_anonymous_requests(): void
    {
        $this->getJson('/api/feed')->assertStatus(401);
    }

    public function test_authenticated_user_can_create_post_with_embedding_and_authenticity_score(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', [
            'text' => 'This is a genuine post about my morning routine and reading books.',
            'image_url' => 'https://example.com/image.jpg'
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('text', 'This is a genuine post about my morning routine and reading books.');
        $response->assertJsonPath('image_url', 'https://example.com/image.jpg');

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'text' => 'This is a genuine post about my morning routine and reading books.',
        ]);

        $post = Post::where('user_id', $user->id)->first();
        $this->assertNotNull($post->embedding);
        $this->assertGreaterThan(0.5, $post->authenticity_score);
    }

    public function test_post_creation_validation_rules(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Validation error on missing text
        $this->postJson('/api/posts', [
            'image_url' => 'https://example.com/image.jpg'
        ])->assertStatus(422)->assertJsonValidationErrors(['text']);

        // Validation error on invalid URL format
        $this->postJson('/api/posts', [
            'text' => 'Valid text content',
            'image_url' => 'not-a-valid-url'
        ])->assertStatus(422)->assertJsonValidationErrors(['image_url']);
    }

    public function test_authenticated_user_can_retrieve_feed_paginated(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        // Create a few posts manually to populate the feed
        $embeddings = app(\App\Services\EmbeddingClient::class);
        $ranking = app(\App\Services\FeedRankingService::class);
        
        for ($i = 0; $i < 5; $i++) {
            $text = "This is organic test post number {$i} with some thoughts.";
            Post::create([
                'user_id' => $user->id,
                'text' => $text,
                'image_url' => null,
                'embedding' => $embeddings->literal($embeddings->embed($text)),
                'authenticity_score' => $ranking->authenticity($text),
                'created_at' => now()->subHours($i),
            ]);
        }

        $response = $this->getJson('/api/feed');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'current_page',
            'data' => [
                '*' => [
                    'id',
                    'user_id',
                    'text',
                    'image_url',
                    'authenticity_score',
                    'created_at',
                    'updated_at',
                    'time_ago',
                    'formatted_date',
                    'ranking_score',
                    'has_reacted',
                    'author' => ['id', 'name']
                ]
            ],
            'first_page_url',
            'from',
            'last_page',
            'last_page_url',
            'path',
            'per_page',
            'to',
            'total'
        ]);
    }

    public function test_authenticated_user_can_search_posts_using_vector_similarity(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $embeddings = app(\App\Services\EmbeddingClient::class);
        $ranking = app(\App\Services\FeedRankingService::class);

        // Create some posts manually
        $text1 = 'lake reflection and birds sound';
        Post::create([
            'user_id' => $user->id,
            'text' => $text1,
            'image_url' => null,
            'embedding' => $embeddings->literal($embeddings->embed($text1)),
            'authenticity_score' => $ranking->authenticity($text1),
        ]);

        $text2 = 'promotional discount buy now';
        Post::create([
            'user_id' => $user->id,
            'text' => $text2,
            'image_url' => null,
            'embedding' => $embeddings->literal($embeddings->embed($text2)),
            'authenticity_score' => $ranking->authenticity($text2),
        ]);

        $response = $this->getJson('/api/search?q=lake');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'user_id',
                    'text',
                    'image_url',
                    'authenticity_score',
                    'created_at',
                    'updated_at',
                    'time_ago',
                    'formatted_date',
                    'similarity',
                    'has_reacted',
                    'author' => ['id', 'name']
                ]
            ]
        ]);
    }

    public function test_authenticated_user_can_log_interaction(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $embeddings = app(\App\Services\EmbeddingClient::class);
        $ranking = app(\App\Services\FeedRankingService::class);
        $text = 'A nice random post for interaction test';

        $post = Post::create([
            'user_id' => $user->id,
            'text' => $text,
            'image_url' => null,
            'embedding' => $embeddings->literal($embeddings->embed($text)),
            'authenticity_score' => $ranking->authenticity($text),
        ]);

        $response = $this->postJson('/api/interactions', [
            'post_id' => $post->id,
            'type' => 'reaction'
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('user_id', $user->id);
        $response->assertJsonPath('post_id', $post->id);
        $response->assertJsonPath('type', 'reaction');

        $this->assertDatabaseHas('interactions', [
            'user_id' => $user->id,
            'post_id' => $post->id,
            'type' => 'reaction',
        ]);
    }
}
