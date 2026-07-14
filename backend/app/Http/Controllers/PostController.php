<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\EmbeddingClient;
use App\Services\FeedRankingService;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(private EmbeddingClient $embeddings, private FeedRankingService $ranking) {}
    public function store(Request $request) {
        $data = $request->validate(['text' => ['required', 'string', 'max:5000'], 'image_url' => ['nullable', 'url', 'max:2048']]);
        $post = Post::create([...$data, 'user_id' => $request->user()->id, 'embedding' => $this->embeddings->literal($this->embeddings->embed($data['text'])), 'authenticity_score' => $this->ranking->authenticity($data['text'])]);
        return response()->json($post->load('author:id,name'), 201);
    }

    public function me(Request $request) {
        return response()->json(
            Post::where('user_id', $request->user()->id)
                ->with('author:id,name')
                ->select('posts.*')
                ->selectRaw(
                    'EXISTS(SELECT 1 FROM interactions WHERE interactions.post_id = posts.id AND interactions.user_id = ? AND interactions.type = \'reaction\') AS has_reacted',
                    [$request->user()->id]
                )
                ->orderBy('created_at', 'desc')
                ->paginate(20)
        );
    }
}
