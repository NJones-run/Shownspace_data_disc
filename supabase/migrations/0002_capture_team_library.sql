create schema if not exists data_disc;

grant usage on schema data_disc to anon, authenticated, service_role;
grant all on all tables in schema data_disc to service_role;
grant all on all sequences in schema data_disc to service_role;
alter default privileges in schema data_disc grant all on tables to service_role;
alter default privileges in schema data_disc grant all on sequences to service_role;

create table if not exists data_disc.capture_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists data_disc.capture_team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references data_disc.capture_teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create table if not exists data_disc.capture_team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references data_disc.capture_teams(id) on delete cascade,
  player_id text not null,
  first_name text not null,
  last_name text not null,
  jersey_number text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, player_id)
);

create table if not exists data_disc.capture_team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references data_disc.capture_teams(id) on delete cascade,
  token_hash text not null unique,
  role text not null default 'scorer' check (role in ('scorer')),
  label text,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists capture_teams_slug_idx on data_disc.capture_teams(slug);
create index if not exists capture_team_players_team_idx on data_disc.capture_team_players(team_id);
create index if not exists capture_team_members_user_idx on data_disc.capture_team_members(user_id);
create index if not exists capture_team_invites_team_idx on data_disc.capture_team_invites(team_id);
