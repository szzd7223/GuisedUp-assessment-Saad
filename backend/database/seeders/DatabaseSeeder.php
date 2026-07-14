<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Post;
use App\Models\Interaction;
use App\Services\EmbeddingClient;
use App\Services\FeedRankingService;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $maya = User::factory()->create(['name' => 'Maya Kapoor', 'email' => 'maya@guisedup.test', 'password' => 'password']);
        $arjun = User::factory()->create(['name' => 'Arjun Mehta', 'email' => 'arjun@guisedup.test', 'password' => 'password']);
        $embeddings = app(EmbeddingClient::class); $ranking = app(FeedRankingService::class);
        foreach ([[$arjun, 'A tiny roadside chai stop made our monsoon drive unforgettable.'], [$maya, 'Learning to make space for quiet Sundays and long conversations.'], [$arjun, 'Funny travel story: our train had a surprise goat passenger.']] as [$author, $text]) {
            $post = Post::create(['user_id' => $author->id, 'text' => $text, 'embedding' => $embeddings->literal($embeddings->embed($text)), 'authenticity_score' => $ranking->authenticity($text)]);
            if ($author->id !== $maya->id) Interaction::create(['user_id' => $maya->id, 'post_id' => $post->id, 'type' => 'view']);
        }
    }
}
