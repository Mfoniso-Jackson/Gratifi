-- Sponsors and the Dream Fund. Built ahead of legal sign-off and switched off by default:
-- nothing here shows to customers unless GRATIFI_SPONSORS_ENABLED=true (or demo mode).

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create table if not exists public.sponsor_campaigns (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  name text not null,
  mode text not null default 'match' check (mode in ('match', 'milestone', 'grant')),
  fund_pence integer not null default 0 check (fund_pence >= 0),
  fund_spent_pence integer not null default 0 check (fund_spent_pence >= 0),
  placement_fee_pence integer not null default 0 check (placement_fee_pence >= 0),
  starts_on date,
  ends_on date,
  status text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  created_at timestamptz not null default now()
);

-- Which venues a campaign runs in. A venue can block a sponsor (for example a rival to what it stocks).
create table if not exists public.campaign_venues (
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  blocked boolean not null default false,
  primary key (campaign_id, venue_id)
);

create table if not exists public.worker_dreams (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  sponsor_campaign_id uuid references public.sponsor_campaigns(id) on delete set null,
  title text not null,
  story text,
  target_pence integer not null check (target_pence > 0),
  funded_pence integer not null default 0 check (funded_pence >= 0),
  status text not null default 'active' check (status in ('active', 'funded', 'withdrawn')),
  created_at timestamptz not null default now()
);

-- One row per dream-linked tip. The unique recognition id stops a repeated webhook counting twice.
create table if not exists public.dream_contributions (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.worker_dreams(id) on delete cascade,
  recognition_event_id uuid unique references public.recognition_events(id) on delete set null,
  from_tip_pence integer not null default 0,
  match_pence integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sponsor_views (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.sponsor_campaigns(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  page text not null check (page in ('tip', 'thank_you')),
  created_at timestamptz not null default now()
);

create index if not exists worker_dreams_worker_idx on public.worker_dreams(worker_id);
create index if not exists dream_contributions_dream_idx on public.dream_contributions(dream_id);
create index if not exists sponsor_views_campaign_idx on public.sponsor_views(campaign_id, created_at);

alter table public.sponsors enable row level security;
alter table public.sponsor_campaigns enable row level security;
alter table public.campaign_venues enable row level security;
alter table public.worker_dreams enable row level security;
alter table public.dream_contributions enable row level security;
alter table public.sponsor_views enable row level security;

-- Sponsor deals are GratiFi admin business. Venue owners can see the dreams of their own staff.
create policy "Admins manage sponsors" on public.sponsors for all to authenticated
  using (public.is_gratifi_admin()) with check (public.is_gratifi_admin());
create policy "Admins manage campaigns" on public.sponsor_campaigns for all to authenticated
  using (public.is_gratifi_admin()) with check (public.is_gratifi_admin());
create policy "Admins manage campaign venues" on public.campaign_venues for all to authenticated
  using (public.is_gratifi_admin()) with check (public.is_gratifi_admin());
create policy "Admins manage dreams" on public.worker_dreams for all to authenticated
  using (public.is_gratifi_admin()) with check (public.is_gratifi_admin());
create policy "Owners read their staff's dreams" on public.worker_dreams for select to authenticated
  using (exists (select 1 from public.workers w where w.id = worker_id and public.can_access_venue(w.venue_id)));
create policy "Admins read contributions" on public.dream_contributions for select to authenticated
  using (public.is_gratifi_admin());
create policy "Admins read sponsor views" on public.sponsor_views for select to authenticated
  using (public.is_gratifi_admin());

-- Public bucket for sponsor logos (uploaded by server code with the service role).
insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do nothing;
