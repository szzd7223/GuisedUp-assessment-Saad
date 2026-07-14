<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class FeedRankingService
{
    public function __construct(private EmbeddingClient $embeddings) {}

    public function feedFor(User $viewer): LengthAwarePaginator
    {
        $interest = DB::selectOne("SELECT AVG(p.embedding)::text AS vector FROM interactions i JOIN posts p ON p.id = i.post_id WHERE i.user_id = ?", [$viewer->id])->vector ?? null;
        $interest ??= $this->embeddings->literal(array_fill(0, EmbeddingClient::DIMENSIONS, 0));
        return Post::query()->with('author:id,name')
            ->select('posts.*')
            ->selectRaw("(0.40 * GREATEST(0, 1 - (posts.embedding <=> ?::vector)) + 0.30 * LEAST(1, COALESCE(LOG(1 + (SELECT COUNT(*) FROM interactions ri JOIN posts rp ON rp.id = ri.post_id WHERE ri.user_id = ? AND rp.user_id = posts.user_id)), 0) / LOG(21)) + 0.15 * posts.authenticity_score + 0.15 * EXP(-EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 604800)) AS ranking_score", [$interest, $viewer->id])
            ->orderByDesc('ranking_score')->orderByDesc('created_at')->paginate(20);
    }

    public function search(string $query): \Illuminate\Support\Collection
    {
        $vector = $this->embeddings->literal($this->embeddings->embed($query));
        return Post::query()->with('author:id,name')->select('posts.*')->selectRaw('1 - (embedding <=> ?::vector) AS similarity', [$vector])->orderByDesc('similarity')->limit(10)->get();
    }

    public function authenticity(string $text): float
    {
        $penalty = min(0.55, substr_count($text, '#') * .05 + preg_match_all('/https?:\\/\\//i', $text) * .12 + substr_count($text, '!') * .02);
        return round(max(.25, .95 - $penalty), 2);
    }
}
