-- Self-serve signup, referral codes and venue subscriptions.

alter table public.venues
  add column if not exists referral_code text unique,
  add column if not exists referred_by_code text,
  add column if not exists signup_source text not null default 'admin'
    check (signup_source in ('admin', 'self_serve'));

-- Every venue gets a short code it can share; venues that sign up through it are credited.
update public.venues
  set referral_code = lower(substr(md5(id::text), 1, 8))
  where referral_code is null;

create table if not exists public.venue_subscriptions (
  venue_id uuid primary key references public.venues(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro', 'group')),
  billing_interval text not null default 'month' check (billing_interval in ('month', 'year')),
  -- Mirrors Stripe's subscription status: trialing, active, past_due, canceled, unpaid, incomplete...
  status text not null,
  payroll_addon boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  trial_end timestamptz,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.venue_subscriptions enable row level security;

-- Written by server code only (Stripe webhooks); readable by admins and the venue's owners.
create policy "Admins and owners read their subscriptions"
  on public.venue_subscriptions for select
  to authenticated
  using (public.can_access_venue(venue_id));
