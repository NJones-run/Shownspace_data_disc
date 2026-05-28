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
