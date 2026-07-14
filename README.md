# Guised Up - Real Connections Feed

This repository implements the Guised Up take-home assessment. The product intentionally ranks connection quality and relevance rather than popularity.

## Stack

- **Mobile:** Expo + React Native
- **API:** Laravel 13, Laravel Sanctum bearer tokens
- **Embeddings:** FastAPI deterministic embedding service (64 dimensions)
- **Data:** PostgreSQL 16 + pgvector

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set `APP_KEY` with `php artisan key:generate`.
2. Start PostgreSQL and embeddings: `docker compose up --build`.
3. In `backend`, run `composer install`, then `php artisan migrate --seed` and `php artisan serve`.
4. In `mobile`, run `npm install` then `npx expo start`.

The API runs on `http://localhost:8000`; FastAPI runs on `http://localhost:8001`.

## Demo accounts

| Email | Password |
| --- | --- |
| maya@guisedup.test | password |
| arjun@guisedup.test | password |

Obtain a token through `POST /api/login` with the email and password, then send `Authorization: Bearer <token>`.

## Video walkthrough (2-3 minutes)

1. Explain the four non-engagement ranking signals and show the architecture diagram in `docs/TSD.md`.
2. Start the API, log in as Maya, and show the personalized feed.
3. Search for a natural-language phrase, explain that vector similarity rather than keyword matching is used, then react to a post.
4. Create a post and point out that its embedding is automatically generated.
5. Show `sql/queries.sql`, tests, and the deterministic demo embedding limitation.
