# Supabase Setup for TailTalk AI

To enable multi-user sync, you need to set up a free Supabase project.

## 1. Create a Project
1.  Go to [supabase.com](https://supabase.com) and sign up.
2.  Create a default project (e.g., "TailTalk").

## 2. Get API Keys
1.  Go to **Project Settings** -> **API**.
2.  Copy the `Project URL` (SUPABASE_URL).
3.  Copy the `anon public` key (SUPABASE_ANON_KEY).

## 3. Add to Vercel
Go to **Settings** -> **Environment Variables** in your Vercel project and add these two keys:

**Key 1: Project URL**
*   **Name**: `VITE_SUPABASE_URL`
*   **Value**: `https://your-project-id.supabase.co`  *(Make sure to include https:// and remove any spaces at the end!)*

**Key 2: Anon Key**
*   **Name**: `VITE_SUPABASE_ANON_KEY`
*   **Value**: `eyJw...` *(This is a long string starts with "ey", paste the whole thing)*

> [!IMPORTANT]
> The names **MUST** start with `VITE_` or the app will not be able to read them.

## 4. Create the Database Table
Go to the **SQL Editor** in your Supabase dashboard and run this script:

```sql
-- Create the events table
create table events (
  id text primary key,
  type text not null,
  "rawText" text,
  metadata jsonb,
  timestamp bigint not null,
  user_id uuid references auth.users not null default auth.uid()
);

-- Enable Row Level Security (RLS)
alter table events enable row level security;

-- Policy: Users can only see their own events (or you can make it public for a "family" sharing setup)
-- SIMPLE SET UP FOR FAMILY SHARING (Anyone logged in can verify):
create policy "Enable all access for authenticated users" 
on events for all 
to authenticated 
using (true) 
with check (true);
```

## Troubleshooting
If Vercel says "Invalid URL" or rejects it:
1.  Check for **extra spaces** at the start or end of the URL.
2.  Ensure it starts with `https://`.
3.  Ensure you pasted the **URL** into the `VITE_SUPABASE_URL` value, not the key.
4.  Try typing it manually if copy-paste is adding hidden characters.
