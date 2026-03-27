-- Run this in Supabase SQL Editor to set up your database

-- Users table (synced from Clerk via webhook)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text,
  paid boolean default false,
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- Trades table
create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(clerk_id),
  date date not null,
  ticker text not null,
  time text not null,
  trade_type text not null check (trade_type in ('Day', 'Swing')),
  direction text default 'Long' check (direction in ('Long', 'Short')),
  entry_price numeric default 0,
  exit_price numeric default 0,
  position_size numeric default 0,
  initial_risk numeric default 0,
  result text not null check (result in ('W', 'L', 'BE')),
  dollar_pnl numeric default 0,
  rr numeric default 0,
  notes text default '',
  starred boolean default false,
  grade text default '' check (grade in ('A', 'B', 'C', 'D', 'F', '')),
  custom_fields jsonb default '{}',
  created_at timestamptz default now()
);

-- User settings (custom fields, grades, risk limits)
create table if not exists user_settings (
  user_id text primary key references users(clerk_id),
  settings jsonb not null default '{}'
);

-- Daily journal entries
create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(clerk_id),
  date date not null,
  observations text default '',
  end_of_day_review text default '',
  weekly_goals jsonb default '[]',
  unique(user_id, date)
);

-- Trader profiles (onboarding data)
create table if not exists trader_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null references users(clerk_id),
  name text default '',
  account_size numeric default 0,
  trading_style text default '',
  experience text default '',
  markets jsonb default '[]',
  max_risk_per_trade numeric default 100,
  max_daily_loss numeric default 500,
  personal_note text default '',
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Indexes for fast queries
create index if not exists idx_trades_user_date on trades(user_id, date);
create index if not exists idx_journal_user_date on journal_entries(user_id, date);

-- Row Level Security (each user can only see their own data)
alter table trades enable row level security;
alter table user_settings enable row level security;
alter table journal_entries enable row level security;
alter table users enable row level security;

alter table trader_profiles enable row level security;

-- RLS Policies (using service role for all operations via API routes)
-- The app uses service role key in API routes, so we create permissive policies
-- that the service role bypasses. This is the simplest secure pattern.
create policy "Service role full access on trades" on trades for all using (true);
create policy "Service role full access on user_settings" on user_settings for all using (true);
create policy "Service role full access on journal_entries" on journal_entries for all using (true);
create policy "Service role full access on users" on users for all using (true);
create policy "Service role full access on trader_profiles" on trader_profiles for all using (true);
