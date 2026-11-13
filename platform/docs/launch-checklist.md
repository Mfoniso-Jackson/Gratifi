# Launch Checklist

Use this checklist after the repo is deployed and before taking live payments.

## Supabase

- Create a Supabase project.
- Run `supabase/migrations/001_initial_gratifi.sql`, then `002_pilot_playbook.sql`, `003_access_control.sql`, `004_qr_scans.sql`, `005_billing_and_signup.sql`, `006_staff_accounts.sql`, `007_sponsors.sql` and `008_pilot_end_dreams_wall.sql`.
- In Supabase Auth, set the Site URL to your domain and keep email confirmation on: self-serve venue sign-ups and staff invites both send emails.
- Turn off public sign-ups in Supabase Auth, or keep them on: accounts without a role in `admin_users` get no access either way.
- Grant yourself access with `pnpm grant:access <email> admin`, and venue owners with `pnpm grant:access <email> owner <venue-slug>`.
- Copy the project URL, anon key, and service role key into Vercel.
- Create the first admin user with `pnpm seed:demo` or through Supabase Auth.
- Confirm RLS is enabled on `venues`, `workers`, and `recognition_events`.

## Stripe

- Create products are not required; GratiFi creates Checkout Sessions dynamically.
- Add a webhook endpoint for `/api/stripe/webhook`.
- Subscribe to `checkout.session.completed`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed` and `customer.subscription.created`, `.updated` and `.deleted`.
- Switch on the Stripe customer portal so venues can manage their plan.
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

## Growth features

- Self-serve sign-up lives at `/for-venues`; each venue's referral link is on its admin page.
- Venues choose a plan at `/admin/billing` (Stripe test mode first). Turn on the Stripe customer portal for "Manage billing".
- Staff sign in at `/staff/login` after a manager invites them from the Staff page.
- Payroll export is at `/admin/payroll` (Pro, the add-on, or during the pilot).
- Sponsors and the Dream Fund stay off until legal sign-off. Set them up at `/admin/sponsors`, then set `GRATIFI_SPONSORS_ENABLED=true` to show them to customers.
- **When a pilot ends without a plan:** venues get a 7-day grace period (`PILOT_GRACE_DAYS`), then stop taking new tips. Their dashboard, history, payroll export and billing keep working, and choosing a plan restarts them at once. Tick "Don't bill this venue" on a venue's admin page for founding pilots you've comped.
- Staff can propose their own dream at `/staff`; managers approve it on the Staff page. Venue owners can block sponsors on their venue's page. The public Dream Wall is at `/dreams`. All three show only when sponsors are switched on.
