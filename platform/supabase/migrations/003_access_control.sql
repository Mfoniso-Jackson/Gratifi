-- Access control: only listed users can use the admin area.
--
-- Before this migration any signed-in account could read and edit every venue,
-- worker and recognition. Now:
--   admin        GratiFi staff: every venue, plus pilot tools and protocol status.
--   venue_owner  only the venues listed for them in venue_members.
-- Accounts with no row in admin_users get no access at all.
--
-- Grant access with: pnpm grant:access <email> admin
--                or: pnpm grant:access <email> owner <venue-slug>

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'venue_owner')),
  created_at timestamptz not null default now()
);

create table if not exists public.venue_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, venue_id)
);

create index if not exists venue_members_venue_id_idx on public.venue_members(venue_id);

alter table public.admin_users enable row level security;
alter table public.venue_members enable row level security;

-- Users may see their own access rows (the middleware checks them with the user's session).
-- Only the service role (server code and scripts) can grant or change access.
create policy "Users read their own access"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users read their own venue memberships"
  on public.venue_members for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_gratifi_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_access_venue(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_gratifi_admin()
    or exists (
      select 1
      from public.venue_members m
      join public.admin_users a on a.user_id = m.user_id
      where m.user_id = auth.uid() and m.venue_id = target and a.role = 'venue_owner'
    );
$$;

-- Replace the "any signed-in user" policies from 001 and 002.
drop policy if exists "Authenticated admins can read venues" on public.venues;
drop policy if exists "Authenticated admins can write venues" on public.venues;
drop policy if exists "Authenticated admins can read workers" on public.workers;
drop policy if exists "Authenticated admins can write workers" on public.workers;
drop policy if exists "Authenticated admins can read recognition events" on public.recognition_events;
drop policy if exists "Authenticated admins can read pilot checklist" on public.pilot_checklist_items;
drop policy if exists "Authenticated admins can write pilot checklist" on public.pilot_checklist_items;
drop policy if exists "Authenticated admins can read pilot evidence" on public.pilot_evidence;
drop policy if exists "Authenticated admins can write pilot evidence" on public.pilot_evidence;

create policy "Admins and owners read their venues"
  on public.venues for select
  to authenticated
  using (public.can_access_venue(id));

create policy "Admins manage venues"
  on public.venues for all
  to authenticated
  using (public.is_gratifi_admin())
  with check (public.is_gratifi_admin());

create policy "Admins and owners read their workers"
  on public.workers for select
  to authenticated
  using (public.can_access_venue(venue_id));

create policy "Admins and owners manage their workers"
  on public.workers for all
  to authenticated
  using (public.can_access_venue(venue_id))
  with check (public.can_access_venue(venue_id));

create policy "Admins and owners read their recognition events"
  on public.recognition_events for select
  to authenticated
  using (public.can_access_venue(venue_id));

create policy "Admins manage pilot checklist"
  on public.pilot_checklist_items for all
  to authenticated
  using (public.is_gratifi_admin())
  with check (public.is_gratifi_admin());

create policy "Admins manage pilot evidence"
  on public.pilot_evidence for all
  to authenticated
  using (public.is_gratifi_admin())
  with check (public.is_gratifi_admin());
