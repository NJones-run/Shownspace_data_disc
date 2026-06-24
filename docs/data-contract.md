# Data Contract

## Capture Boundary

The scorer app captures raw manual events. It does not write directly to canonical production tables.

## Staging Tables

### `data_disc.manual_games`

One row per capture session.

- `session_id`
- `GameID`
- `device_id`
- `scorer_name`
- `tracked_team_id`
- `opponent_name`
- `game_date`
- `tournament_name`
- `sync_status`
- `created_at`
- `updated_at`

### `data_disc.manual_events`

One row per scorer-entered event.

- `session_id`
- `client_event_id`
- `GameID`
- `event_seq`
- `event_type`
- `team_side`
- `team_id`
- `actor_player_id`
- `target_player_id`
- `offensive_line_player_ids`
- `defensive_line_player_ids`
- `field_x`
- `field_y`
- `game_clock_seconds_remaining`
- `quarter`
- `point_number`
- `possession_number`
- `home_score`
- `away_score`
- `payload`
- `validation_status`
- `created_at`
- `updated_at`

### `data_disc.manual_event_audit`

Immutable audit trail for edits, deletes, sync attempts, and reviewer actions.

## Supabase Migration

The staging tables live in the `data_disc` schema and are defined in `supabase/migrations/0001_manual_staging.sql`. The app writes through the Next.js API route with `SUPABASE_SERVICE_ROLE_KEY`; the browser never receives the service role key.

## Promotion Rule

Promotion transforms reviewed `data_disc.manual_events` into canonical event rows compatible with the existing backend pipeline. Promotion must validate uniqueness before writing canonical tables.
