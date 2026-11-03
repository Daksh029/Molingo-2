# Molingo

A playful Gujarati learning demo built with Next.js, React, and TypeScript. Six animal companions guide beginners through short lessons, Romanized Gujarati phrases, and checkpoint quizzes.

**[View the live demo](https://molingo.vercel.app)**

## Project purpose

Molingo is a portfolio project demonstrating interactive UI development, responsive design, client-side state management, Next.js route handlers, and automated testing. It is a demonstration application rather than a production learning platform.

The hosted demo is intended to run without a paid speech API. You can explore lessons, answer quizzes, and unlock chapters without connecting an API key.

## Features

- Six themed chapters and 120 curated lesson phrases.
- A distinct illustrated companion for each chapter: otter, panda, fox, bunny, koala, and penguin.
- Back, Continue, and direct question navigation.
- Four checkpoint quizzes per chapter, with answer feedback and quiz-based chapter unlocks.
- Chapter-completion celebrations and matching animal companions inside lessons.
- Browser speech synthesis and microphone controls, subject to browser support.
- Clear recovery when recording permissions, speech recognition, or scoring are unavailable.
- Retry queues for failed progress submissions.
- Responsive chapter cards, keyboard focus styles, and reduced-motion support.

## Demo limitations

- **No accounts or private learner profiles:** visitors use a shared demo learner identity. Progress should not be treated as personal or private.
- **Temporary progress:** without `POSTGRES_URL`, progress lives in server memory. It can reset on restart or redeployment and differ between server instances.
- **Limited speech support:** Play Audio uses browser speech synthesis; Gujarati voice availability varies by browser and operating system. Browser recognition may rely on the browser vendor's online service.
- **No connected paid speech service:** recording does not guarantee a pronunciation score. If the browser supplies a transcript, the app can use its local phrase-matching evaluator. Otherwise it displays an error and allows learners to continue.
- **Demo trust model:** quiz results are supplied by the client, learner IDs are not authenticated, and speech endpoints do not have production authentication or rate limiting.
- **No sensitive data:** use sample phrases only. Do not enter private information or submit sensitive recordings.

Optional speech and Postgres integration code remains in the repository for reference. Connecting a paid service would require additional access controls, abuse protection, and a review of data handling.

## Stack

- Next.js 15 App Router and React 19
- TypeScript
- CSS and reusable SVG animal illustrations
- Zod request validation
- Vitest, Testing Library, and jsdom
- Optional Postgres adapter using `pg`

## Run locally

Use Node.js 24, matching the Vercel project configuration.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). No environment variables or external services are required for the basic demo.

For optional integrations, copy `.env.example` to `.env.local`. Leave `OPENAI_API_KEY` and `POSTGRES_URL` blank for the no-API, in-memory demo. Never commit credentials; local environment files are ignored by Git.

## Checks

```bash
npm test
npx tsc --noEmit
npm run build
```

The current suite has 32 tests covering curriculum, scoring, progress, route contracts, and lesson interactions. Button tests cover every question across all six chapters, correct and incorrect quiz choices, chapter completion, browser speech playback calls, simulated recording cleanup and permission failures, missing-service recovery, and offline quiz queueing.

Real microphone input, audible Gujarati voice quality, and a live paid speech API are not covered by the simulated tests.

## Structure

- `app/`: pages and route handlers
- `components/`: chapter cards, animal illustrations, and lesson player
- `lib/`: curriculum, quiz flow, scoring, and progress storage
- `tests/`: unit, route-contract, and interaction tests

## Deployment

The live demo is deployed on Vercel from the `main` branch of this repository. The basic demo can be deployed without API credentials or a database.
