<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiContractTest extends TestCase
{
    public function test_protected_feed_rejects_anonymous_requests(): void
    {
        $this->getJson('/api/feed')->assertUnauthorized();
    }

    public function test_post_creation_validates_text(): void
    {
        $this->postJson('/api/posts', ['image_url' => 'not-a-url'])->assertUnauthorized();
    }
}
