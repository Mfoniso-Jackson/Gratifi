# Architecture

GratiFi is organised as protocol-shaped SaaS.

## Layers

1. Customer Experience: venue, worker, tip, and success pages.
2. Recognition Engine: validation, normalisation, persistence, anchoring, retry.
3. Payment Service: Stripe Checkout and webhook verification.
4. GratiFiProtocol contract on Base: immutable recognition record registry.
5. Recognition Ledger: Supabase `recognition_events`.
6. Protocol API: versioned `/api/v1` response shapes.
7. Future SDK Boundary: stable service and API objects.

## Reliability

If Stripe succeeds and the chain write fails, the recognition remains valid. The event is stored with `anchor_status = 'retry'`, and admins can retry anchoring. The contract and database both prevent duplicate recognition hashes.

## Security

- Stripe webhook signatures are required.
- Tip amounts are validated server-side.
- Messages are trimmed and capped.
- Secrets stay server-side.
- Operator private keys never reach the browser.
- Supabase service role key never reaches the browser.
