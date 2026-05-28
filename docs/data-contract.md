# Data Contract

## Capture Boundary

The scorer app captures raw manual events. It does not write directly to canonical production tables.

## Staging Tables

### `manual_games`

One row per capture session.

- `session_id`
- `GameID`
- `device_id`
- `scorer_name`
- `sync_status`
- `created_at`
- `updated_at`

### `manual_events`

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
- `quarter`
- `point_number`
- `possession_number`
- `home_score`
- `away_score`
- `payload`
- `validation_status`
- `created_at`
- `updated_at`

### `manual_event_audit`

Immutable audit trail for edits, deletes, sync attempts, and reviewer actions.

## Promotion Rule

Promotion transforms reviewed `manual_events` into canonical event rows compatible with the existing backend pipeline. Promotion must validate uniqueness before writing canonical tables.
