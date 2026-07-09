# GratiFi

GratiFi v1.0 is a production-oriented recognition protocol and web platform for venues. Customers scan a QR code, recognise a worker, pay through Stripe, and see a simple success message. The backend stores the event in Supabase and anchors a deterministic recognition hash on Moonbeam.

Customer-facing UX intentionally avoids wallet, gas, token, and chain language. Internally, the system is structured as protocol infrastructure so a public API and SDK can be added later.

## Stack

- Next.js 15 App Router
- React and TypeScript strict mode
- Tailwind CSS
- Supabase Postgres and Supabase Auth for admins
- Stripe Checkout and verified webhooks
- Solidity `^0.8.20`
- Hardhat and ethers v6
- Moonbeam anchoring

## Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.example .env.local
```

3. Apply the Supabase migration in `supabase/migrations/001_initial_gratifi.sql`.

4. Start the app:

```bash
pnpm dev
```

5. Run tests:

```bash
pnpm test
pnpm hardhat:test
```

6. Check production environment coverage:

```bash
pnpm check:env
```

7. Seed a pilot venue after Supabase is configured:

```bash
pnpm seed:demo
```

## Core Flow

1. Customer scans a venue or worker QR code.
2. Customer selects a worker and recognition amount.
3. Stripe Checkout collects payment.
4. The Stripe webhook verifies settlement.
5. `RecognitionEngine` validates and normalises the event.
6. `HashService` generates deterministic hashes.
7. Supabase stores the recognition event.
8. `MoonbeamService` anchors the recognition on `GratiFiProtocol`.
9. Admin can inspect status, retry anchoring, and export CSV.

## Protocol Boundaries

The MVP exposes internal v1 routes that are shaped for a future SDK:

- `GET /api/v1/venues`
- `POST /api/v1/venues`
- `GET /api/v1/workers?venueId=...`
- `POST /api/v1/workers`
- `GET /api/v1/recognitions`
- `POST /api/v1/recognitions`
- `GET /api/v1/verify/[recognitionHash]`

## Admin

Admin pages live under `/admin`:

- Overview
- Venues
- Venue QR card
- Workers
- Recognition events
- Protocol status

Production deployments should enforce Supabase Auth middleware for `/admin` and admin API routes.

## Deployment

Use Vercel with the project root set to `platform`. The included `vercel.json` sets the install and build commands. See `docs/launch-checklist.md` for the remaining account-level setup.

## Pilot Operations

The pilot playbook lives under `/admin/pilot` and supports venue onboarding, QR deployment, feedback capture, metrics export, and case-study generation.

Operator docs:

- `docs/pilot-setup-guide.md`
- `docs/venue-onboarding-process.md`
- `docs/qr-placement-guide.md`
- `docs/staff-training-guide.md`
- `docs/pilot-metrics-guide.md`
- `docs/evidence-collection-guide.md`
