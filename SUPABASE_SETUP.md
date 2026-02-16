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

## 4. Create the Database Table
Go to the **SQL Editor** in your Supabase dashboard and run this script:

```sql
-- Create the events table (pack-based, no auth required)
create table events (
  id text primary key,
  type text not null,
  "rawText" text,
  metadata jsonb,
  timestamp bigint not null,
  pack_id text not null,
  logged_by text
);

-- Index for fast pack lookups
create index idx_events_pack_id on events (pack_id);

-- Enable Row Level Security
alter table events enable row level security;

-- Allow public read/write (pack code acts as shared secret)
create policy "Public pack access"
  on events for all
  using (true)
  with check (true);

-- Enable realtime for this table
alter publication supabase_realtime add table events;
```

## 5. How Sharing Works

1. The first user (admin) completes onboarding → a unique **pack code** is generated.
2. In Settings or at the end of onboarding, tap **Share Pack Link** → copies URL with `?pack=CODE`.
3. Other users open the link → they join the same pack and see all events in real-time.
4. Any pack member can log events → they appear for everyone instantly.

## Troubleshooting
- If Vercel says "Invalid URL", check for extra spaces and ensure it starts with `https://`.
- If events don't sync, ensure the `events` table has `pack_id` column and Realtime is enabled.
- If you had an older events table, drop it and recreate: `drop table if exists events;`
