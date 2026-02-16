# Supabase Setup for TailTalk AI

To enable multi-user sync, you need a free Supabase project.

## 1. Create a Project
1.  Go to [supabase.com](https://supabase.com) and sign up.
2.  Create a project (e.g., "TailTalk").

## 2. Get API Keys
1.  Go to **Project Settings** -> **API**.
2.  Copy the `Project URL` (SUPABASE_URL).
3.  Copy the `anon public` key (SUPABASE_ANON_KEY).

## 3. Add to Vercel
Go to **Settings** -> **Environment Variables** in your Vercel project and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJw...` (long string starting with "ey") |

> [!IMPORTANT]
> The names **MUST** start with `VITE_` or the app will not be able to read them.

## 4. Create the Database Tables
Go to the **SQL Editor** in your Supabase dashboard and run this script:

```sql
-- Drop old tables if they exist
drop table if exists events;
drop table if exists packs;

-- Packs table: stores the dog profile shared by all pack members
create table packs (
  pack_id text primary key,
  dog_name text not null,
  dog_breed text not null,
  life_stage text not null,
  dog_sex text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Events table: stores all logged events, grouped by pack
create table events (
  id text primary key,
  type text not null,
  "rawText" text,
  metadata jsonb,
  timestamp bigint not null,
  pack_id text not null references packs(pack_id),
  logged_by text
);

-- Index for fast pack lookups
create index idx_events_pack_id on events (pack_id);

-- Enable Row Level Security on both tables
alter table packs enable row level security;
alter table events enable row level security;

-- Allow public read/write (pack code acts as shared secret)
create policy "Public pack access" on packs for all using (true) with check (true);
create policy "Public event access" on events for all using (true) with check (true);

-- Enable realtime for events
alter publication supabase_realtime add table events;
```

## 5. How Sharing Works

1. The admin completes onboarding → a unique **pack code** is generated and the dog profile is saved to the `packs` table.
2. Tap **Share Pack Link** → copies URL with `?pack=CODE`.
3. Other users open the link → dog profile is auto-fetched from Supabase, they just enter their name and go straight to the dashboard.
4. All events sync in real-time between all pack members.

## Troubleshooting
- If Vercel says "Invalid URL", check for extra spaces and ensure it starts with `https://`.
- If events don't sync, ensure both `packs` and `events` tables exist and Realtime is enabled.
- If you had older tables, drop them first: `drop table if exists events; drop table if exists packs;`
