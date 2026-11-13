-- Pilot end, staff-proposed dreams, venue sponsor blocks and the public Dream Wall.

-- Venues GratiFi has agreed not to bill (founding pilots, partners). They never pause.
alter table public.venues
  add column if not exists billing_exempt boolean not null default false;

-- Staff can propose a dream; a manager approves (active) or declines it.
alter table public.worker_dreams drop constraint if exists worker_dreams_status_check;
alter table public.worker_dreams
  add constraint worker_dreams_status_check
  check (status in ('pending', 'active', 'funded', 'withdrawn', 'declined'));

alter table public.worker_dreams
  add column if not exists proposed_by text not null default 'admin' check (proposed_by in ('admin', 'staff')),
  add column if not exists review_note text,
  add column if not exists reviewed_at timestamptz,
  -- Staff choose whether their dream appears on the public Dream Wall.
  add column if not exists show_on_wall boolean not null default true;

create policy "Staff read their own dreams"
  on public.worker_dreams for select
  to authenticated
  using (exists (select 1 from public.workers w where w.id = worker_id and w.user_id = auth.uid()));

-- A venue can block a sponsor outright, which also covers campaigns created later.
create table if not exists public.venue_sponsor_blocks (
  venue_id uuid not null references public.venues(id) on delete cascade,
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (venue_id, sponsor_id)
);

alter table public.venue_sponsor_blocks enable row level security;

create policy "Admins and owners read their sponsor blocks"
  on public.venue_sponsor_blocks for select
  to authenticated
  using (public.can_access_venue(venue_id));

-- Sponsor views can now also come from the Dream Wall.
alter table public.sponsor_views drop constraint if exists sponsor_views_page_check;
alter table public.sponsor_views
  add constraint sponsor_views_page_check check (page in ('tip', 'thank_you', 'wall'));
