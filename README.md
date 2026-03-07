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

3. (Optional) add keys in `.env.local`

- `OPENAI_API_KEY` for real speech transcription + synthesis
- `POSTGRES_URL` for persistent server-side progress

4. Run dev server

```bash
npm run dev
```

5. Run tests

```bash
npm test
```

## Notes

- If `OPENAI_API_KEY` is missing, speech evaluation uses a safe local fallback and TTS returns a placeholder response.
- If `POSTGRES_URL` is missing, progress is stored in-memory for local development.
