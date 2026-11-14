-- Payouts to venues (option A): each venue connects its own Stripe Express account. Tips are charged
-- with the venue's account as the destination, so they're paid to the venue, which passes them to
-- staff through payroll. GratiFi never holds tip money.

alter table public.venues add column if not exists stripe_account_id text unique;
-- Mirrors the connected account's status from Stripe's account.updated events.
alter table public.venues add column if not exists stripe_charges_enabled boolean not null default false;
alter table public.venues add column if not exists stripe_payouts_enabled boolean not null default false;
alter table public.venues add column if not exists stripe_details_submitted boolean not null default false;
alter table public.venues add column if not exists stripe_account_updated_at timestamptz;
