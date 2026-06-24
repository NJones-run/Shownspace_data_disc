# Architecture

## Boundary

`frisbee-live-capture` owns the scorer experience, local storage, staging upload, and review workflow. The existing BYU/UFA backend remains the canonical stats pipeline.

## Flow

```text
Existing DB games/teams/players
  -> game package API
  -> IndexedDB cache
  -> tablet event capture
  -> sync queue
  -> data_disc manual staging tables
  -> review
  -> canonical pipeline promotion
```

## First Real Integration Points

- Replace demo game-package data with Supabase reads.
- Persist `manual_events` batches to `data_disc` staging tables.
- Add reviewer auth before approving sessions.
- Build a promotion job that converts reviewed manual events into canonical event rows.
