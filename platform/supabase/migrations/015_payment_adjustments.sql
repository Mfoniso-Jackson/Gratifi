-- A log of money moved back from (or returned to) venues' Stripe accounts after refunds and
-- disputes. Written by the webhook (service role); readable by GratiFi admins.
create table if not exists public.payment_adjustments (
  id uuid primary key default gen_random_uuid(),
  stripe_payment_intent_id text,
  kind text not null check (kind in ('refund_reversal', 'dispute_reversal', 'dispute_return')),
  amount_pence integer not null check (amount_pence > 0),
  -- The charge (refunds) or dispute the adjustment answers, and the Stripe reversal or transfer made.
  stripe_ref text not null,
  stripe_object_id text,
  created_at timestamptz not null default now()
);

create index if not exists payment_adjustments_ref_idx on public.payment_adjustments(stripe_ref);

alter table public.payment_adjustments enable row level security;

create policy "Admins read payment adjustments"
  on public.payment_adjustments for select
  to authenticated
  using (public.is_gratifi_admin());
