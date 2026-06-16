-- Herd or Drink: Supabase schema
-- Run this in the Supabase SQL Editor

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  game_code text not null,
  total_rounds integer not null default 0,
  winner_name text,
  played_at timestamptz not null default now()
);

create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  player_name text not null,
  sip_bank_remaining integer not null default 0,
  is_winner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index for looking up player stats by name
create index if not exists idx_game_players_name on game_players(player_name);
create index if not exists idx_games_played_at on games(played_at desc);

-- Enable Row Level Security (read-only for anon)
alter table games enable row level security;
alter table game_players enable row level security;

-- Allow anyone to read (for leaderboard/stats)
create policy "Public read games" on games for select using (true);
create policy "Public read game_players" on game_players for select using (true);
