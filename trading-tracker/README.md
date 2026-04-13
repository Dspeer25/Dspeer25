# Trading Tracker

Personal trading journal, leaderboard, growth simulator and daily journal.

## Deploy Your Own Copy (Free)

Each person gets a completely independent deployment — their own URL, their own database, their own data.

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New project**, give it any name, set a password, click **Create**
3. Once it loads, go to **SQL Editor** (left sidebar)
4. Paste and run this SQL:

```sql
create table if not exists app_data (
  key   text primary key,
  value jsonb not null default 'null'::jsonb
);

alter table app_data enable row level security;

create policy "allow all" on app_data
  for all
  using (true)
  with check (true);
```

5. Go to **Project Settings → API** and copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Deploy to Vercel

Click the button below. It will fork this repo to your GitHub and deploy it. When prompted, paste your two Supabase values from Step 1.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Dspeer25/Trading-Tracker&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Get%20these%20from%20your%20Supabase%20project%20settings%20API&project-name=trading-tracker&repository-name=trading-tracker)

You'll get your own URL (e.g. `trading-tracker-abc123.vercel.app`) and your data is completely separate from everyone else's.
