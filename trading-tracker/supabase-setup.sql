-- Run this once in your Supabase project:
-- supabase.com → your project → SQL Editor → paste & run

create table if not exists app_data (
  key   text primary key,
  value jsonb not null default 'null'::jsonb
);

-- Allow all reads and writes (single-user personal app, no auth needed)
alter table app_data enable row level security;

create policy "allow all" on app_data
  for all
  using (true)
  with check (true);
