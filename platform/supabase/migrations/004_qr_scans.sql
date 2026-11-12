-- QR scan counting: one row each time a venue or tip page is opened from a GratiFi QR code
-- (QR codes link with ?src=qr). Lets venues see how many scans turn into tips.
create table if not exists public.qr_scans (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists qr_scans_venue_created_idx on public.qr_scans(venue_id, created_at desc);

alter table public.qr_scans enable row level security;

-- Written only by server code (service role); readable by admins and the venue's owners.
create policy "Admins and owners read their scans"
  on public.qr_scans for select
  to authenticated
  using (public.can_access_venue(venue_id));
