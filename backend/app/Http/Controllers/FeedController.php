<?php

namespace App\Http\Controllers;

use App\Models\Interaction;
use App\Models\Post;
use App\Services\FeedRankingService;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    public function __construct(private FeedRankingService $ranking) {}
    public function index(Request $request) { return response()->json($this->ranking->feedFor($request->user())); }
    public function search(Request $request) { $data = $request->validate(['q' => ['required', 'string', 'max:500']]); return response()->json(['data' => $this->ranking->search($data['q'])]); }
    public function interact(Request $request) {
        $data = $request->validate(['post_id' => ['required', 'exists:posts,id'], 'type' => ['required', 'in:view,reply,reaction']]);
        $interaction = Interaction::create([...$data, 'user_id' => $request->user()->id]);
        return response()->json($interaction, 201);
    }
}
