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
        
        if ($interest !== null) {
            $semanticSql = "0.40 * GREATEST(0.0, 1.0 - (posts.embedding <=> :interest::vector))";
            $bindings = [
                'interest' => $interest,
                'viewer_id' => $viewer->id,
            ];
        } else {
            // Default baseline semantic contribution (0.0) when user has no profile interest
            $semanticSql = "0.0";
            $bindings = [
                'viewer_id' => $viewer->id,
            ];
        }

        return Post::query()->with('author:id,name')
            ->select('posts.*')
            ->selectRaw(
                "LEAST(1.0, GREATEST(0.0,
                    {$semanticSql}
                    + 0.30 * LEAST(1.0, COALESCE(LOG(1.0 + (SELECT COUNT(*) FROM interactions ri JOIN posts rp ON rp.id = ri.post_id WHERE ri.user_id = :viewer_id AND rp.user_id = posts.user_id)), 0.0) / LOG(21.0))
                    + 0.15 * COALESCE(posts.authenticity_score, 0.5)
                    + 0.15 * COALESCE(EXP(-EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 604800.0), 0.5)
                    + CASE WHEN posts.user_id = :viewer_id THEN 0.50 * EXP(-EXTRACT(EPOCH FROM (NOW() - posts.created_at)) / 86400.0) ELSE 0.0 END
                )) AS ranking_score,
                EXISTS(SELECT 1 FROM interactions WHERE interactions.post_id = posts.id AND interactions.user_id = :viewer_id AND interactions.type = 'reaction') AS has_reacted",
                $bindings
            )
            ->orderByDesc('ranking_score')->orderByDesc('created_at')->paginate(20);
    }

    public function search(string $query, User $viewer): \Illuminate\Support\Collection
    {
        $vector = $this->embeddings->literal($this->embeddings->embed($query));
        return Post::query()->with('author:id,name')
            ->select('posts.*')
            ->selectRaw(
                '1 - (embedding <=> :query::vector) AS similarity,
                EXISTS(SELECT 1 FROM interactions WHERE interactions.post_id = posts.id AND interactions.user_id = :viewer_id AND interactions.type = "reaction") AS has_reacted',
                [
                    'query' => $vector,
                    'viewer_id' => $viewer->id
                ]
            )
            ->orderByDesc('similarity')
            ->limit(10)
            ->get();
    }

    public function authenticity(string $text): float
    {
        if (empty(trim($text))) return 0.25;

        $penalty = 0.0;

        // --- Penalties ---

        // Hashtags: gaming SEO / trending signals
        $hashCount = substr_count($text, '#');
        $penalty += min(0.20, $hashCount * 0.05);

        // External links: promotion / traffic farming
        $urlCount = preg_match_all('/https?:\/\//i', $text);
        $penalty += min(0.20, $urlCount * 0.12);

        // Promotional / engagement-bait keywords
        $promoWords = ['follow', 'subscribe', 'dm me', 'dm for', 'click', 'buy now',
                       'giveaway', 'contest', 'win', 'free', 'discount', 'sale',
                       'link in bio', 'check my', 'like and share', 'share this',
                       'collab', 'promo', 'swipe up', 'limited offer'];
        $lowerText = strtolower($text);
        $promoPenalty = 0.0;
        foreach ($promoWords as $word) {
            if (str_contains($lowerText, $word)) {
                $promoPenalty += 0.07;
            }
        }
        $penalty += min(0.30, $promoPenalty);

        // ALL CAPS abuse (>30% of alpha chars are uppercase)
        $alphaChars = preg_replace('/[^a-zA-Z]/', '', $text);
        if (strlen($alphaChars) > 5) {
            $upperRatio = strlen(preg_replace('/[^A-Z]/', '', $text)) / strlen($alphaChars);
            if ($upperRatio > 0.30) $penalty += 0.10;
        }

        // Exclamation overuse (engagement pressure)
        $bangCount = substr_count($text, '!');
        $penalty += min(0.08, max(0, $bangCount - 1) * 0.02);

        // Engagement-bait question spam (>3 question marks)
        $questionCount = substr_count($text, '?');
        if ($questionCount > 3) $penalty += min(0.08, ($questionCount - 3) * 0.02);

        // Very short posts feel low-effort (< 30 chars)
        if (mb_strlen(trim($text)) < 30) $penalty += 0.12;

        // --- Bonuses (subtract from penalty) ---

        // First-person voice signals genuine personal expression
        $firstPerson = preg_match_all('/\b(I|my|me|we|our|I\'ve|I\'m|I\'d|I\'ll)\b/i', $text);
        $bonus = min(0.10, $firstPerson * 0.03);

        // Longer, well-developed posts feel more thoughtful
        $wordCount = str_word_count($text);
        if ($wordCount >= 30) $bonus += 0.05;

        $total = max(0.0, $penalty - $bonus);
        return round(max(0.20, 0.85 - $total), 2);
    }
}
