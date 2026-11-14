-- A random salt per tip, mixed into its note, venue and staff hashes (docs/protocol/hashing-standard.md).
--
-- It lives in its own table, not on recognition_events: row-level security on recognition_events
-- lets signed-in staff and venue owners read their rows through the Supabase API, and RLS controls
-- rows, not columns. This table has RLS on and no policies, and table access is revoked from the
-- anon and authenticated roles, so only the server (service role) can read a salt.
-- Deleting a salt on an erasure request unlinks the tip's on-chain fingerprint for good.
create table if not exists public.recognition_salts (
  recognition_id uuid primary key references public.recognition_events(id) on delete cascade,
  salt text not null,
  created_at timestamptz not null default now()
);

alter table public.recognition_salts enable row level security;
revoke all on public.recognition_salts from anon, authenticated;
