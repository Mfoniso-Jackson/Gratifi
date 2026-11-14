-- Hourly batching of the blockchain record, a Bitcoin backup with OpenTimestamps, and tracking
-- card fees that customers chose to cover.

-- One row per hourly batch: a Merkle root written to Base, then stamped on Bitcoin.
create table if not exists public.anchor_batches (
  id uuid primary key default gen_random_uuid(),
  merkle_root text not null unique,
  leaf_count integer not null check (leaf_count > 0),
  chain_id integer not null,
  contract_address text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed')),
  tx_hash text,
  block_number bigint,
  error text,
  -- OpenTimestamps: 'submitted' once a calendar has accepted the root. The proof becomes final on
  -- Bitcoin a few hours later; `ots upgrade` fetches the completed proof from the calendar.
  ots_status text not null default 'not_submitted' check (ots_status in ('not_submitted', 'submitted', 'failed')),
  ots_proofs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists anchor_batches_created_idx on public.anchor_batches(created_at desc);

alter table public.anchor_batches enable row level security;

-- Batches hold only hashes and transaction details, all public on-chain anyway.
create policy "Admins read batches"
  on public.anchor_batches for select
  to authenticated
  using (public.is_gratifi_admin());

alter table public.recognition_events add column if not exists anchor_batch_id uuid references public.anchor_batches(id);
alter table public.recognition_events add column if not exists merkle_proof jsonb;
create index if not exists recognition_events_anchor_batch_idx on public.recognition_events(anchor_batch_id);

-- The card fee the customer chose to add (0 when they didn't). Never part of the tip itself.
alter table public.recognition_events add column if not exists fee_covered_pence integer not null default 0 check (fee_covered_pence >= 0);
