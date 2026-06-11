# Frisbee Live Capture

Offline-first tablet web app for event-by-event live frisbee data capture.

## Goals

- Capture live game events locally on a tablet.
- Keep scorers working through spotty network conditions.
- Sync raw scorer-entered events into staging tables.
- Review and approve staged data before promoting it to canonical stats tables.

## Stack

- Next.js App Router
- TypeScript
- IndexedDB for offline storage
- API routes for staging sync and review

## Getting Started

Install dependencies once Node/npm are available:

```bash
npm install
npm run dev
```

## Supabase Staging Setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_manual_staging.sql` in the Supabase SQL editor, or through the Supabase CLI.
3. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`.
4. Start the app with `npm run dev`, record events in Capture, then use the Sync button to write rows into `manual_games` and `manual_events`.

## Render Deployment

This app must be deployed as a Render Web Service because it uses Next.js API routes for Supabase writes.

Use the included `render.yaml` blueprint, or configure manually:

```text
Build Command: npm ci && npm run build
Start Command: npm start
```

Add these environment variables in Render:

```text
NEXT_PUBLIC_APP_NAME=Frisbee Live Capture
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Project Shape

```text
app/
  capture/
  review/
  games/
  api/
components/
lib/
  db/
  sync/
  event-model/
  validation/
  supabase/
tests/
docs/
```

## Safety Boundary

This app writes scorer-entered events only to staging/review tables. It does not write directly to canonical production tables like `throws`, `blocks`, `pulls`, `penalties`, `player_game_stats`, or rollup tables.
