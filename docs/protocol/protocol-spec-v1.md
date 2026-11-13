# GratiFi Protocol Specification v1.0

## Purpose

GratiFi is a blockchain-backed recognition protocol (Base since 2026; Moonbeam before it shut down) for recording real-world service appreciation. The current production product lets a customer scan a venue or worker QR code, select a recognition amount, pay through Stripe, and receive confirmation that the recognition has been permanently recorded.

The protocol exists to make recognition events auditable, durable, and portable without exposing customers to wallets, gas, tokens, or chain-specific language.

## Design Principles

- Walletless customer experience.
- No raw personal data on-chain.
- Stripe is the source of payment truth.
- Supabase is the operational recognition ledger.
- Base anchors canonical recognition hashes.
- Recognition events are deterministic and verifiable.
- v1 does not include tokens, NFTs, reputation scoring, AI, or KILT credentials.
- Internal APIs are versioned so they can evolve into public APIs and SDKs.

## Recognition Event Lifecycle

1. Customer scans a QR code for a venue or worker.
2. Customer selects a worker and recognition amount.
3. Customer optionally adds a thank-you message.
4. Stripe Checkout processes payment.
5. The Stripe webhook verifies payment settlement.
6. `RecognitionEngine` validates and normalises the event payload.
7. `HashService` creates `message_hash` and `recognition_hash`.
8. Supabase stores the recognition event.
9. `ChainService` submits the recognition hash to `GratiFiProtocol.sol`.
10. Supabase updates anchor status, transaction hash, block number, contract address, and confirmation time.
11. Admins can verify or retry anchoring from the dashboard.

## Data Model

Core v1 entities:

- `venues`: real-world service locations.
- `workers`: staff members associated with venues.
- `recognition_events`: payment-verified recognition records.
- `pilot_checklist_items`: operational deployment state for pilots.
- `pilot_evidence`: feedback and case-study evidence for pilots.

`recognition_events` is the protocol ledger table. It stores operational context and the canonical hashes required for verification.

## Hashing Model

GratiFi uses deterministic hashing to bind a recognition event to its canonical payload.

- The message is trimmed and hashed as `message_hash`.
- Venue and worker identifiers are hashed before being submitted on-chain.
- The recognition payload is normalised with stable field ordering.
- The normalised payload includes `protocolVersion`, venue, worker, amount, currency, message hash, and Stripe payment reference.
- `recognition_hash` uniquely identifies a recognition event.
- The database enforces uniqueness on `recognition_hash`.
- The contract prevents duplicate `recognition_hash` records.

## Contract Interaction (Base)

The backend calls:

```solidity
recordRecognition(
  bytes32 recognitionHash,
  bytes32 venueHash,
  bytes32 workerHash,
  bytes32 messageHash,
  uint256 amountPence
)
```

Only the authorised backend/operator wallet can record recognitions. The contract stores the recognition hash, entity hashes, message hash, amount, and timestamp, then emits `RecognitionRecorded`.

## API Interaction Model

Current internal v1 routes:

- `GET /api/v1/venues`
- `POST /api/v1/venues`
- `GET /api/v1/workers?venueId=...`
- `POST /api/v1/workers`
- `GET /api/v1/recognitions`
- `POST /api/v1/recognitions`
- `GET /api/v1/verify/[recognitionHash]`

These routes use protocol-style response envelopes and are intended to become the basis for a future SDK.

## Verification Flow

To verify a recognition:

1. Retrieve the recognition event by `recognition_hash`.
2. Confirm the event exists in Supabase.
3. Confirm `anchor_status = confirmed`.
4. Confirm `anchor_tx_hash` and `anchor_block_number` are present.
5. Inspect the transaction on Basescan (or Moonscan for records made before 2026).
6. Confirm the emitted `RecognitionRecorded` event contains the expected `recognitionHash`.

## Privacy Model

The protocol avoids raw personal data on-chain.

- Customer identity is not required.
- Customer wallets are not required.
- Raw thank-you messages are not sent on-chain.
- Venue and worker identifiers are hashed before contract submission.
- Operational data remains in Supabase under application access controls.

## Failure and Retry Model

Stripe success and on-chain anchoring are separate steps.

If Stripe succeeds but the chain write fails:

- the recognition remains valid;
- Supabase stores it with `anchor_status = retry`;
- the admin dashboard can retry anchoring;
- duplicate on-chain writes are prevented by `recognition_hash`.

## Future Extension Points

The v1 architecture reserves space for:

- public API keys;
- developer SDKs;
- KILT-based venue or worker attestations;
- token modules;
- staking modules;
- recognition rewards;
- treasury and governance modules.

These are not implemented in v1. They are extension points, not current product promises.
