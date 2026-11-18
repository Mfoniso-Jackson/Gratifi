# GratiFi: guidance for every session

Read [`docs/strategy/README.md`](docs/strategy/README.md) first. It sets the direction for all
work in this repository. [`docs/strategy/customer-assumptions.md`](docs/strategy/customer-assumptions.md)
says what tippers, staff and owners want, and which assumptions the pilot is testing; check new work
against it.

## What GratiFi is and where it's going

GratiFi lets customers thank the people who served them with a tip and a note, by QR code or NFC tap,
with no app. Tips are paid to the venue's own Stripe account (Stripe Connect) and passed to staff
through payroll. Each tip gets a salted, permanent record on Base, backed up on Bitcoin.

The goal is a global platform where frontline workers get paid, recognised and hired: UK first, then
Ireland, the US, Canada, Australia and Europe. The worker account that moves with people between jobs
is the long-term product.

## Current stage: 1, prove the UK

- **Feature freeze** until the 3-venue pilot has 30 days of data (decision on 31 December 2026).
  Only fix what the test run or pilot venues turn up, unless the owner asks for something else.
- Before building anything new, ask: does it help the pilot succeed, or the worker account later?
  If neither, suggest deferring it.

## Product rules

1. **Never hold tip money.** Tips are destination charges to the venue's connected account. Holding
   worker money needs a licence or a licensed partner first.
2. **Compliance is a feature.** Respect tipping laws (staff get tips in full; no deductions) and data
   rules (UK GDPR now; others per country).
3. **The blockchain stays invisible.** No tokens, wallets or crypto language for customers or staff.
   Only salted hashes go on-chain; salts live in the server-only `recognition_salts` table.
4. **Build global-ready, launch local.** Don't add new UK-only assumptions (hard-coded GBP, `£`,
   `en-GB`, UK-only law wording) where avoiding them is cheap. Existing ones are listed in
   [`docs/strategy/globalisation-debt.md`](docs/strategy/globalisation-debt.md); update that list if
   you add or remove one.
5. **Workers are users too.** Don't design data or features that would stop a worker's record moving
   between venues later.
6. **Sponsors and the Dream Fund stay switched off** (`GRATIFI_SPONSORS_ENABLED`) until the legal
   review clears them.
7. **Never pressure people to tip.** No pop-ups, no pre-selected tip, no reminders, nothing at the
   card machine. Notes are an invitation and tips are optional; customers resent tip prompts.
8. **Lead with the person.** Customers want to thank whoever served them, so staff badges and staff
   pages come first; venue-wide pages are the fallback.

## Engineering rules

- The app is in `platform/` (Next.js 15, Supabase, Stripe, Base). Run `npx tsc --noEmit`,
  `npx vitest run` and `npx playwright test --trace off` from there before pushing.
- Every feature must work in demo mode (`GRATIFI_DEMO_MODE=true`, the in-memory store in
  `lib/demo/`): add sample data for new tables and bump `DEMO_DATA_KEY` when it changes.
- Database changes are new numbered files in `platform/supabase/migrations/`, with RLS on every
  table. Add each one to `platform/docs/launch-checklist.md`.
- Stripe webhook handling must be idempotent; any money movement uses idempotency keys.
- Update the relevant guide in `platform/docs/` with every change that affects setup or operations.
- Write user-facing text and docs in plain English: short sentences, no jargon.
