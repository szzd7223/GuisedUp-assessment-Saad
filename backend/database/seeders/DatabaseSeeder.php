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

    public function run(): void
    {
        // --- Users ---
        $maya   = User::factory()->create(['name' => 'Maya Kapoor',   'email' => 'maya@guisedup.test',  'password' => 'password']);
        $arjun  = User::factory()->create(['name' => 'Arjun Mehta',   'email' => 'arjun@guisedup.test', 'password' => 'password']);
        $kabir  = User::factory()->create(['name' => 'Kabir Dev',     'email' => 'kabir@guisedup.test', 'password' => 'password']);
        $zara   = User::factory()->create(['name' => 'Zara Ali',      'email' => 'zara@guisedup.test',  'password' => 'password']);
        $rohan  = User::factory()->create(['name' => 'Rohan Shah',    'email' => 'rohan@guisedup.test', 'password' => 'password']);
        $priha  = User::factory()->create(['name' => 'Priha Sen',     'email' => 'priha@guisedup.test', 'password' => 'password']);
        $leo    = User::factory()->create(['name' => 'Leo Cruz',      'email' => 'leo@guisedup.test',   'password' => 'password']);
        $dev    = User::factory()->create(['name' => 'Dev Anand',     'email' => 'dev@guisedup.test',   'password' => 'password']);

        $embeddings = app(EmbeddingClient::class);
        $ranking    = app(FeedRankingService::class);

        // -------------------------------------------------------------------
        // POST DATA: [author, text]
        // Text is written to naturally score at various authenticity tiers.
        // The engine calculates scores — we just write the content.
        // -------------------------------------------------------------------
        $posts = [

            // ============================================================
            // HIGHLY AUTHENTIC — personal, first-person, long, thoughtful
            // Expected: ✦ Authentic Voice
            // ============================================================

            [$maya, "I have been thinking about the way we consume information these days. Every morning I scroll through my phone before even getting out of bed, and somehow that sets the tone for the entire day. Started leaving my phone on the other side of the room last week. The difference has been remarkable — I am sleeping better and waking up with actual thoughts of my own."],

            [$maya, "Spent three hours in the kitchen today making my grandmother's dal recipe from scratch. I kept calling her mid-cook to double-check measurements. We ended up talking for over an hour about nothing in particular. Sometimes I think the cooking is just an excuse to have that conversation."],

            [$kabir, "I turned down a really lucrative freelance offer this week because the project felt misaligned with what I actually care about. The silence afterward was uncomfortable. But I think learning when to say no is one of the more underrated life skills, and I am still figuring it out at thirty-two."],

            [$kabir, "My morning routine is embarrassingly simple. A cup of chai, twenty minutes of reading something completely unrelated to work, and a short walk. That is it. I resisted adding more to it for a long time because everyone seems to have some optimized five-step ritual. Simple works better for me."],

            [$priha, "I sat with a close friend today who is going through something really difficult. I did not have advice. I did not have the right words. I just stayed there and listened for two hours. Afterwards she said that was exactly what she needed. I keep underestimating how powerful it is to simply be present."],

            [$priha, "Woke up before sunrise this morning and walked down to the lake. There was nobody there. Just mist sitting on the water, a few birds, and the sound of the city slowly waking up in the distance. I stood there for about twenty minutes and my brain went properly quiet for the first time in weeks."],

            [$maya, "My therapist asked me today what I would do if I stopped performing productivity and just existed for a day. I genuinely had no answer. That silence told me more about myself than the forty-five minutes before it. Going to sit with that question for a while."],

            [$arjun, "We drove up to the hills last weekend without a plan or a reservation. Ended up sleeping in the car one night when the guesthouse we found was full. My partner was annoyed for about ten minutes and then we both started laughing at the absurdity of it. Some of my best memories are from trips that went sideways."],

            [$arjun, "I have been learning to make bread every Sunday for the past two months. The first six loaves were genuinely inedible. The seventh one came out almost right and I felt a disproportionate sense of accomplishment. There is something about working with your hands that resets whatever is overclocked in my brain."],

            [$zara, "I finally finished that stack of books that has been sitting on my nightstand for months. The last one was a slim book on attention and how modern life systematically dismantles our ability to be present. I read the whole thing on my phone, which felt darkly ironic. Still, it changed something in how I am approaching my evenings."],

            [$dev, "Had coffee with someone I have not seen in six years. We picked up exactly where we left off. No awkward catching-up preamble, no performing how busy or successful we have both become. Just conversation that felt worth having. I forget sometimes that real friendship has no expiry date."],

            [$dev, "I watched my father try to use a video call for the first time today. It took forty minutes and I had to stay calm through all of it. What got me was how hard he was trying and how much he wanted to get it right just so he could see my niece. I spent the rest of the afternoon feeling a lot of complicated feelings about time and distance."],

            [$rohan, "I spent last Saturday completely offline. No phone, no laptop. I read, cooked, took a long walk, and napped without guilt. By evening I was restless. By Sunday morning I understood that the restlessness was just withdrawal. By Sunday afternoon I felt genuinely rested for the first time in months."],

            [$kabir, "My landlord raised the rent again. Instead of spiralling like I usually do I sat down and actually mapped out my spending for the first time in years. Found three subscriptions I had completely forgotten about. Still working through whether I stay or move. But the exercise of looking honestly at the numbers felt like reclaiming something."],

            [$priha, "My neighbor grows jasmine on her balcony and every evening around dusk it blooms and the scent drifts through my window. I have been here for two years and I only noticed it properly last week. I wonder what else I am walking past without actually seeing."],

            // ============================================================
            // ORGANIC MOMENT — genuine but shorter or with minor imperfections
            // Expected: ◈ Organic Moment
            // ============================================================

            [$arjun, "A tiny roadside chai stall outside Coorg made our entire monsoon drive worthwhile. Nothing fancy, just a wood fire, two tin cups, and the rain outside. The chai cost twelve rupees. Some things just cannot be recreated."],

            [$zara, "Learning to make space for quiet Sundays and long conversations was easier than I expected. The hard part is protecting that space once it exists."],

            [$rohan, "Spent two hours listening to old vinyl records today. The slight static between tracks has so much character. Streaming music is convenient but it is not this."],

            [$dev, "Tried fixing my bicycle chain by watching a video. Took an hour. Probably would have taken a mechanic five minutes. Worth it though, I actually understand how it works now."],

            [$maya, "My cat figured out how to open the kitchen cabinet. I am annoyed and impressed in equal measure. She has been sitting next to it for weeks like she was planning this."],

            [$zara, "Read somewhere that the average person checks their phone around ninety times a day. I started counting mine last Tuesday. I stopped counting at sixty and it was not even noon."],

            [$arjun, "Funny travel story: our train had a surprise goat passenger in the luggage compartment. The goat was calmer than most of us."],

            [$kabir, "Planted some tomatoes and basil on the balcony last week. First time I have grown anything intentionally. Checked on them about twelve times today which probably defeats the purpose."],

            [$priha, "Old film photography is back in style and I understand why. Waiting to see photographs instead of seeing them instantly changes your relationship to the moment you are capturing. You remember it differently."],

            [$dev, "Stayed up too late reading about the history of cartography. There is something genuinely moving about the maps people drew of oceans and continents they had never seen, filling in the blank spaces with best guesses. We are all doing that."],

            [$rohan, "Sourdough update: the loaf I made yesterday looked perfect and tasted like cardboard. Still calling it progress. My wife disagrees."],

            [$maya, "My office has started enforcing no-meeting Fridays. It is the most impactful workplace policy change I have experienced in eight years of working. Why did it take this long."],

            // ============================================================
            // CURATED — shorter, some hashtags, slightly promotional tone
            // Expected: ◎ Curated
            // ============================================================

            [$leo, "Big news: I've joined a new startup and I'm so incredibly excited to share this journey with all of you! Follow along as I document every step! #career #newbeginnings #startup"],

            [$leo, "Check out my morning routine! Wake up at 5am, meditate, exercise, journal, and conquer the day! If I can do it, so can you! Tag a friend who needs to hear this! #morningroutine #hustle #motivation"],

            [$zara, "Just wrapped a collaboration with an amazing brand that truly aligns with my values. More details coming very soon! #collab #lifestyle #sponsored"],

            [$rohan, "Weekend vibes loading... Here's to good food, good company, and making memories! Hit the heart if you're having a great weekend! #weekend #vibes #positivevibes"],

            [$leo, "5 things I wish I had known at 25: 1. Invest early. 2. Network relentlessly. 3. Read every day. 4. Exercise consistently. 5. Sleep well. Save this for later! #productivity #lifetips #growthmindset"],

            [$dev, "Tried this new matcha oat latte everyone is talking about. Honestly it's quite good! #coffee #matchalatte #morningfuel #aesthetic"],

            [$arjun, "Throwback to that road trip last winter! Best decision I made all year honestly! Some memories you just keep coming back to! #throwback #roadtrip #memories #travel"],

            [$zara, "Slowly building habits that actually stick. If you're on the same journey, let me know in the comments! #habits #selfimprovement #wellness #mindset"],

            [$rohan, "Finally tried that restaurant downtown everyone keeps recommending! The ambience was incredible! Food was a solid 8/10! #foodie #diningout #restaurantreview"],

            [$kabir, "This quote hit me today: 'The secret of getting ahead is getting started.' Sharing it because someone needed to hear this today. Tag that person! #quote #inspiration #motivation #mondaymood"],

            // ============================================================
            // CLEARLY PROMOTIONAL — heavy hashtags, links, engagement bait
            // Expected: ▲ Promotional
            // ============================================================

            [$leo, "🚨 HUGE GIVEAWAY!! 🚨 I'm giving away FREE coaching sessions to 3 lucky followers!! To WIN: 1. Follow me 2. Like this post 3. Tag 2 friends 4. Subscribe to my newsletter at https://leocruz.link/newsletter WINNER ANNOUNCED FRIDAY!! #giveaway #free #win #contest #follow"],

            [$leo, "BIG SALE THIS WEEKEND ONLY!! 50% OFF my complete course bundle!! Thousands have already transformed their lives with this program!! Don't miss this LIMITED OFFER!! Click here: https://leocruz.link/courses #sale #discount #limitedoffer #courses #learn #succeed"],

            [$leo, "DM ME for exclusive collab opportunities!! My rates are competitive and my audience is HIGHLY ENGAGED!! I work with brands across fitness, lifestyle, travel, and wellness!! Link in bio for my media kit!! #collaboration #influencer #branddeals #sponsored #collab #contentcreator"],

            [$leo, "FOLLOW FOR FOLLOW!! Let's grow together!! I follow back EVERYONE!! Comment 'done' after following and I will follow you back within 24 hours!! Let's build our communities!! #followforfollow #follow #followers #community #grow #instagram"],

            [$rohan, "🔥 Check out this INSANE deal I found!! Click the link below before it expires!! Limited stock available!! Don't miss out!! https://bit.ly/deal123 #deal #shopping #discount #sale #free #win #giveaway #contest"],

            [$leo, "Want to know my SECRET to gaining 10,000 followers in 30 days?? Comment 'YES' below and I'll DM you my complete FREE guide!! This system WORKS and I'm giving it away for free this week ONLY!! Subscribe at https://leocruz.link/guide #growthhack #followers #socialmediatips #free"],

            [$zara, "AD | Loving my new skincare routine with this amazing brand!! Use my code ZARA20 for 20% off!! Link in bio!! #ad #sponsored #skincare #beauty #discount #sale #skincareroutine #glowup #collab"],

            [$dev, "Top 10 PRODUCTIVITY HACKS that will CHANGE YOUR LIFE!! 💥 Number 7 will SHOCK you!! Click the link to read the full list!! https://devlifehacks.link/top10 #productivity #lifehacks #success #hustle #grind #motivation #tips #follow"],

            // ============================================================
            // MIXED BAG — edge cases and borderline posts
            // ============================================================

            [$maya, "I have been sleeping with my windows open and waking up to bird sounds instead of my alarm. Small shift but it changes the entire texture of the morning."],

            [$kabir, "Social media metrics really did kill the joy of sharing for a while. Writing without watching the numbers is something I'm still learning. #reflection"],

            [$arjun, "Hot take: the best part of any trip is the twenty minutes before you arrive when you can see the destination but haven't reached it yet. The anticipation has a particular quality that I spend the rest of the trip trying to recover."],

            [$priha, "My grandmother pressed flowers as a hobby. I found a book of them in her room last month. Every pressed flower had a date and sometimes a note — where she found it, what was happening that day. I keep thinking about what a quiet, complete record of a life looks like."],

            [$dev, "I gave an honest performance review for the first time in my management career this quarter. No softening, no diplomatic fog. Just clear, specific feedback delivered with care. The conversation was hard and it went really well. I should have been doing this for years."],

            [$zara, "The older I get the more I value people who can sit with uncertainty and not immediately reach for a resolution. It is a rarer skill than it sounds."],

            [$rohan, "My son asked me why I go to work. I said to provide for our family. He asked what that means. I spent the rest of the day in a mild identity crisis which I think is reasonable and also good for me."],

            [$maya, "Three-day weekend starts now. No plans on purpose. I've realized I need recovery time that isn't scheduled or productive. Just unstructured time to be a person. This used to feel like wasted time and I'm still unlearning that."],

            [$kabir, "Finished a project today I've been putting off for four months. The actual task took ninety minutes. The four months of avoidance were the hard part. I don't fully understand the psychology of this but I experience it constantly."],

            [$arjun, "Rain started just as we reached the viewpoint. We stayed anyway, stood in it for about ten minutes, and the city below looked extraordinary through the rain. Some of the best versions of places I've visited have been because the conditions were wrong."],
        ];

        // Seed all posts
        $createdPosts = [];
        foreach ($posts as $index => [$author, $text]) {
            // Distribute timestamps back in time (e.g., 3 hours step per post)
            $createdAt = \Carbon\Carbon::now()->subHours($index * 3)->subMinutes(rand(0, 59));
            $post = Post::create([
                'user_id'           => $author->id,
                'text'              => $text,
                'embedding'         => $embeddings->literal($embeddings->embed($text)),
                'authenticity_score'=> $ranking->authenticity($text),
                'created_at'        => $createdAt,
                'updated_at'        => $createdAt,
            ]);
            $createdPosts[] = [$author, $post];
        }

        // --- Realistic interactions ---
        // Maya and Arjun interact with posts to seed the personalization engine
        $postObjects = array_column($createdPosts, 1);

        // Maya views/reacts to thoughtful posts (to build her interest profile)
        foreach ($postObjects as $post) {
            $score = (float) $post->authenticity_score;

            // Maya mostly reacts to authentic and organic content
            if ($post->user_id !== $maya->id && $score >= 0.65) {
                Interaction::create(['user_id' => $maya->id, 'post_id' => $post->id, 'type' => 'view']);
                if ($score >= 0.78 && rand(0, 2) > 0) {
                    Interaction::create(['user_id' => $maya->id, 'post_id' => $post->id, 'type' => 'reaction']);
                }
            }

            // Arjun views travel/adventure-adjacent posts (all posts from others)
            if ($post->user_id !== $arjun->id && rand(0, 1) === 1) {
                Interaction::create(['user_id' => $arjun->id, 'post_id' => $post->id, 'type' => 'view']);
            }
        }
    }
}
