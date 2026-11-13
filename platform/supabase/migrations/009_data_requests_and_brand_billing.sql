-- UK GDPR data requests, and invoicing sponsors for placement fees.

create table if not exists public.data_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  requester_type text not null check (requester_type in ('customer', 'staff', 'venue_owner', 'other')),
  request_type text not null check (request_type in ('access', 'delete', 'correct')),
  email text not null,
  name text,
  -- Customers have no account, so they identify a tip by where, when and how much.
  venue_name text,
  tip_date date,
  amount_pence integer,
  details text,
  status text not null default 'received' check (status in ('received', 'in_progress', 'completed', 'rejected')),
  -- UK GDPR: reply within one month of receiving the request.
  due_on date not null,
  admin_note text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists data_requests_status_due_idx on public.data_requests(status, due_on);

alter table public.data_requests enable row level security;

-- Written by server code only; GratiFi admins read them.
create policy "Admins read data requests"
  on public.data_requests for select
  to authenticated
  using (public.is_gratifi_admin());

-- Brand billing: sponsors are invoiced through Stripe Invoicing for placement fees.
alter table public.sponsors
  add column if not exists billing_email text,
  add column if not exists stripe_customer_id text;

create table if not exists public.sponsor_invoices (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  campaign_id uuid references public.sponsor_campaigns(id) on delete set null,
  description text not null,
  amount_pence integer not null check (amount_pence > 0),
  stripe_invoice_id text unique,
  hosted_invoice_url text,
  status text not null default 'open' check (status in ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_on date,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.sponsor_invoices enable row level security;

create policy "Admins read sponsor invoices"
  on public.sponsor_invoices for select
  to authenticated
  using (public.is_gratifi_admin());
