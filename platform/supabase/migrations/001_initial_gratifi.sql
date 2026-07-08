create extension if not exists "pgcrypto";

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.workers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  display_name text not null,
  role text not null,
  photo_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.recognition_events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id),
  worker_id uuid not null references public.workers(id),
  amount_pence integer not null check (amount_pence > 0),
  currency text not null default 'GBP',
  message text,
  message_hash text not null,
  recognition_hash text not null unique,
  stripe_payment_intent_id text not null unique,
  stripe_status text not null,
  moonbeam_status text not null default 'pending' check (moonbeam_status in ('pending', 'confirmed', 'failed', 'retry')),
  moonbeam_tx_hash text,
  moonbeam_block_number bigint,
  moonbeam_contract_address text,
  protocol_version text not null,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists workers_venue_id_idx on public.workers(venue_id);
create index if not exists recognition_events_venue_id_idx on public.recognition_events(venue_id);
create index if not exists recognition_events_worker_id_idx on public.recognition_events(worker_id);
create index if not exists recognition_events_created_at_idx on public.recognition_events(created_at desc);
create index if not exists recognition_events_moonbeam_status_idx on public.recognition_events(moonbeam_status);

alter table public.venues enable row level security;
alter table public.workers enable row level security;
alter table public.recognition_events enable row level security;

create policy "Public can read active venues"
  on public.venues for select
  using (status = 'active');

create policy "Public can read active workers"
  on public.workers for select
  using (status = 'active');

create policy "Authenticated admins can read venues"
  on public.venues for select
  to authenticated
  using (true);

create policy "Authenticated admins can write venues"
  on public.venues for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins can read workers"
  on public.workers for select
  to authenticated
  using (true);

create policy "Authenticated admins can write workers"
  on public.workers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins can read recognition events"
  on public.recognition_events for select
  to authenticated
  using (true);

create policy "Service role writes recognition events"
  on public.recognition_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
