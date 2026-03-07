# Molingo

Molingo is a Duolingo-inspired Gujarati speaking coach focused on beginner **listening + speaking** with Romanized Gujarati only.

## What is implemented

- 6 guided units, 120 hand-curated lesson phrases
- Cute animal-themed UI and lesson path flow
- Speech endpoints:
  - `POST /api/speech/evaluate`
  - `POST /api/speech/tts`
- Progress endpoints:
  - `GET /api/units`
  - `GET /api/lessons/:unitId`
  - `POST /api/progress/attempt`
  - `POST /api/progress/quiz`
  - `GET /api/progress/summary`
- Postgres persistence with automatic in-memory fallback
- Offline attempt queue in client (syncs when connection returns)
- Vitest coverage for curriculum integrity, API contracts, scoring, and progress summary

## Tech stack

- Next.js 15 + TypeScript
- App Router + route handlers
- `pg` for Vercel-compatible Postgres
- OpenAI speech APIs (TTS + STT) when `OPENAI_API_KEY` is configured

## Quickstart

1. Install deps

```bash
npm install
```

2. Copy env template

```bash
cp .env.example .env.local
```

3. Configure `.env.local`

- `OPENAI_API_KEY` for speech transcription + synthesis
- `POSTGRES_URL` for persistent server-side progress

4. Run dev server

```bash
npm run dev
```

5. Run tests

```bash
npm test
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add env vars from `.env.example` in Vercel Project Settings > Environment Variables.
4. Redeploy after setting env vars.

## Notes

- If `OPENAI_API_KEY` is missing, speech scoring expects browser transcript fallback and client audio uses browser speech synthesis.
- If `POSTGRES_URL` is missing, progress is stored in-memory for local development.
- Unit unlock progression is based on checkpoint quiz passes (every 5 lesson items), not speaking scores.
- v1 runs as a single local learner without account login.
