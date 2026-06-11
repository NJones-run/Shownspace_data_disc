create table if not exists public.manual_games (
  session_id text primary key,
  "GameID" text not null,
  device_id text,
  scorer_name text,
  sync_status text not null default 'accepted_for_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.manual_events (
  id bigint generated always as identity primary key,
  session_id text not null references public.manual_games(session_id) on delete cascade,
  client_event_id text not null,
  "GameID" text not null,
  event_seq integer not null,
  event_type text not null,
  team_side text check (team_side in ('home', 'away')),
  team_id text,
  actor_player_id text,
  target_player_id text,
  offensive_line_player_ids text[],
  defensive_line_player_ids text[],
  field_x numeric(5, 2),
  field_y numeric(5, 2),
  game_clock_seconds_remaining integer,
  quarter integer not null,
  point_number integer not null,
  possession_number integer not null,
  home_score integer not null,
  away_score integer not null,
  occurred_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  sync_status text not null default 'accepted_for_review',
  validation_status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, client_event_id),
  unique (session_id, event_seq)
);

create table if not exists public.manual_event_audit (
  id bigint generated always as identity primary key,
  session_id text not null,
  client_event_id text,
  action text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists manual_games_game_id_idx on public.manual_games ("GameID");
create index if not exists manual_events_game_id_idx on public.manual_events ("GameID");
create index if not exists manual_events_session_seq_idx on public.manual_events (session_id, event_seq);
create index if not exists manual_events_validation_status_idx on public.manual_events (validation_status);
