<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
        DB::statement("CREATE TABLE posts (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            text TEXT NOT NULL,
            image_url VARCHAR(2048) NULL,
            embedding vector(64) NOT NULL,
            authenticity_score NUMERIC(3,2) NOT NULL DEFAULT 0.95,
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
        )");
        DB::statement('CREATE INDEX posts_author_created_idx ON posts (user_id, created_at DESC)');
        DB::statement('CREATE INDEX posts_embedding_hnsw_idx ON posts USING hnsw (embedding vector_cosine_ops)');
        DB::statement("CREATE TABLE interactions (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
            type VARCHAR(16) NOT NULL CHECK (type IN ('view', 'reply', 'reaction')),
            created_at TIMESTAMP NULL, updated_at TIMESTAMP NULL
        )");
        DB::statement('CREATE INDEX interactions_user_created_idx ON interactions (user_id, created_at DESC)');
        DB::statement('CREATE INDEX interactions_post_type_idx ON interactions (post_id, type)');
    }
    public function down(): void { DB::statement('DROP TABLE IF EXISTS interactions'); DB::statement('DROP TABLE IF EXISTS posts'); }
};
