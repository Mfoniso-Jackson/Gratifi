alter table public.venues
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists venue_type text not null default 'other'
    check (venue_type in ('cafe', 'barbershop', 'pub', 'restaurant', 'other')),
  add column if not exists pilot_status text not null default 'prospect'
    check (pilot_status in ('prospect', 'onboarded', 'live', 'paused', 'completed')),
  add column if not exists pilot_start_date date,
  add column if not exists pilot_end_date date,
  add column if not exists qr_placement_notes text,
  add column if not exists staff_training_completed boolean not null default false,
  add column if not exists owner_feedback text,
  add column if not exists staff_feedback text,
  add column if not exists customer_feedback text,
  add column if not exists referral_source text,
  add column if not exists follow_up_date date;

create table if not exists public.pilot_checklist_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  item_key text not null,
  label text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (venue_id, item_key)
);

create table if not exists public.pilot_evidence (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  testimonial_text text,
  feedback_notes text,
  qr_placement_photo_url text,
  screenshot_url text,
  case_study_notes text,
  permission_to_use_quote boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venues_pilot_status_idx on public.venues(pilot_status);
create index if not exists pilot_checklist_items_venue_id_idx on public.pilot_checklist_items(venue_id);
create index if not exists pilot_evidence_venue_id_idx on public.pilot_evidence(venue_id);

alter table public.pilot_checklist_items enable row level security;
alter table public.pilot_evidence enable row level security;

create policy "Authenticated admins can read pilot checklist"
  on public.pilot_checklist_items for select
  to authenticated
  using (true);

create policy "Authenticated admins can write pilot checklist"
  on public.pilot_checklist_items for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins can read pilot evidence"
  on public.pilot_evidence for select
  to authenticated
  using (true);

create policy "Authenticated admins can write pilot evidence"
  on public.pilot_evidence for all
  to authenticated
  using (true)
  with check (true);

create policy "Service role manages pilot checklist"
  on public.pilot_checklist_items for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role manages pilot evidence"
  on public.pilot_evidence for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
