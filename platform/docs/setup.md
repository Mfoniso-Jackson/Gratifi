# Setup Guide

## Requirements

- Node.js 20+
- pnpm
- Supabase project
- Stripe account
- Moonbeam RPC access
- Backend/operator wallet funded for Moonbeam gas

## Steps

1. Install dependencies with `pnpm install`.
2. Create `.env.local` from `.env.example`.
3. Run the Supabase migration.
4. Deploy `GratiFiProtocol` to Moonbeam or Moonbase.
5. Add the deployed contract address to `GRATIFI_PROTOCOL_CONTRACT_ADDRESS`.
6. Configure Stripe webhook forwarding to `/api/stripe/webhook`.
7. Create venues and workers through `/api/v1` routes or the admin UI.
8. Generate QR codes from `/admin/venues/[venueId]`.

## Production Notes

- Use Vercel environment variables, not checked-in secrets.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Keep `MOONBEAM_OPERATOR_PRIVATE_KEY` server-only.
- Keep Stripe webhook verification enabled.
- Configure admin route protection before inviting venue operators.
