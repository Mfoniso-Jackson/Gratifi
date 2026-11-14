# GratiFi Protocol Developer README

## What GratiFi Is

GratiFi is a blockchain-backed (Base) recognition protocol and web platform for real-world service appreciation.

The production app supports:

- venue and worker QR pages;
- walletless customer recognition;
- Stripe Checkout payments;
- Supabase recognition ledger storage;
- Base anchoring;
- admin dashboards;
- pilot operations and evidence capture.

## How Recognition Events Work

1. A customer scans a QR code.
2. The app opens a venue or worker page.
3. The customer selects a worker, amount, and optional thank-you message.
4. Stripe processes payment.
5. A verified Stripe webhook triggers recognition creation.
6. The recognition payload is normalised and hashed.
7. Supabase stores the operational event.
8. Base records the recognition hash through `GratiFiProtocol.sol`.
9. The app stores transaction and block confirmation data.

## Running the Project

From the repository root:

```bash
cd platform
pnpm install
cp .env.example .env.local
pnpm dev
```

Useful checks:

```bash
pnpm exec tsc --noEmit
pnpm exec vitest run
pnpm exec hardhat test
pnpm exec next build
```

## Verifying Recognition Events

Use:

```text
GET /api/v1/verify/[recognitionHash]
```

A confirmed recognition should include:

- `recognition_hash`;
- `anchor_status = confirmed`;
- `anchor_tx_hash`;
- `anchor_block_number`;
- `protocol_version`;
- `confirmed_at`.

Then inspect the transaction on Basescan and confirm the `RecognitionRecorded` event.

## Contributing

Before changing protocol behaviour:

1. Read this directory.
2. Update protocol docs if event structure, hashing, contract behaviour, or API shape changes.
3. Add tests for deterministic hashing and verification logic.
4. Preserve walletless customer UX.
5. Keep raw personal data off-chain.

## Future SDK Direction

A future SDK should provide:

- typed API clients;
- recognition verification helpers;
- hashing utilities;
- contract event parsers;
- webhook validation helpers;
- examples for venue and worker lookup.

The SDK should depend on documented protocol behaviour, not private implementation details.
