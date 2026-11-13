-- Moonbeam shut down in mid-2026, so new tip records are written to Base instead.
-- The columns are renamed to chain-neutral names, and each record now stores the network it was
-- written to, so older Moonbeam records keep linking to the right explorer.

alter table public.recognition_events rename column moonbeam_status to anchor_status;
alter table public.recognition_events rename column moonbeam_tx_hash to anchor_tx_hash;
alter table public.recognition_events rename column moonbeam_block_number to anchor_block_number;
alter table public.recognition_events rename column moonbeam_contract_address to anchor_contract_address;
alter index if exists public.recognition_events_moonbeam_status_idx rename to recognition_events_anchor_status_idx;

alter table public.recognition_events add column if not exists anchor_chain_id integer;

-- Every record confirmed before this migration was written to Moonbeam mainnet.
update public.recognition_events
set anchor_chain_id = 1284
where anchor_chain_id is null and anchor_tx_hash is not null;

-- Records still waiting (pending or retry) will be written to Base by the retry job.
