# Launch Checklist

Use this checklist after the repo is deployed and before taking live payments.

## Supabase

- Create a Supabase project.
- Run `supabase/migrations/001_initial_gratifi.sql`.
- Copy the project URL, anon key, and service role key into Vercel.
- Create the first admin user with `pnpm seed:demo` or through Supabase Auth.
- Confirm RLS is enabled on `venues`, `workers`, and `recognition_events`.

## Stripe

- Create products are not required; GratiFi creates Checkout Sessions dynamically.
- Add a webhook endpoint for `/api/stripe/webhook`.
- Subscribe to `checkout.session.completed`.
- Set `STRIPE_WEBHOOK_SECRET` in Vercel.
- Run one Stripe test payment and confirm a `recognition_events` row is created.

## Moonbeam

- Deploy to Moonbase first with `pnpm hardhat run scripts/deploy-moonbeam.ts --network moonbase`.
- Set `GRATIFI_PROTOCOL_CONTRACT_ADDRESS`.
- Run a test payment and confirm `moonbeam_status` moves to `confirmed`.
- Deploy to Moonbeam mainnet only after the full test-mode path works.

## Vercel

- Import the GitHub repo.
- Set the Vercel root directory to `platform`.
- Add every variable from `.env.example`.
- Confirm the build command is `pnpm exec next build`.
- Confirm the install command is `pnpm install --frozen-lockfile`.

## Pilot

- Create one real venue.
- Add two or three workers.
- Generate venue and worker QR codes.
- Test QR scanning from a phone.
- Confirm the success page says: `Thank you — your recognition has been permanently recorded.`
- Export CSV from `/admin/events`.

## Pilot Playbook

- Run `supabase/migrations/002_pilot_playbook.sql`.
- Open `/admin/pilot`.
- Set each venue contact, type, status, pilot dates, and follow-up date.
- Complete the QR deployment checklist.
- Record feedback and evidence links.
- Export a venue case study from `/admin/pilot/[venueId]/case-study`.
