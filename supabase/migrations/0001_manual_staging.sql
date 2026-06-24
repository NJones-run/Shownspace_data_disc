create schema if not exists data_disc;

grant usage on schema data_disc to anon, authenticated, service_role;
grant all on all tables in schema data_disc to service_role;
grant all on all sequences in schema data_disc to service_role;
alter default privileges in schema data_disc grant all on tables to service_role;
alter default privileges in schema data_disc grant all on sequences to service_role;

create table if not exists data_disc.manual_games (
  session_id text primary key,
  "GameID" text not null,
  device_id text,
  scorer_name text,
  tracked_team_id text,
  opponent_name text,
  game_date date,
  tournament_name text,
  sync_status text not null default 'accepted_for_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table data_disc.manual_games add column if not exists tracked_team_id text;
alter table data_disc.manual_games add column if not exists opponent_name text;
alter table data_disc.manual_games add column if not exists game_date date;
alter table data_disc.manual_games add column if not exists tournament_name text;

create table if not exists data_disc.manual_events (
  id bigint generated always as identity primary key,
  session_id text not null references data_disc.manual_games(session_id) on delete cascade,
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

create table if not exists data_disc.manual_event_audit (
  id bigint generated always as identity primary key,
  session_id text not null,
  client_event_id text,
  action text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists manual_games_game_id_idx on data_disc.manual_games ("GameID");
create index if not exists manual_events_game_id_idx on data_disc.manual_events ("GameID");
create index if not exists manual_events_session_seq_idx on data_disc.manual_events (session_id, event_seq);
create index if not exists manual_events_validation_status_idx on data_disc.manual_events (validation_status);
