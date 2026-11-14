# Environment Variables

`NEXT_PUBLIC_APP_URL`  
Public URL used for QR codes and Stripe redirects.

`NEXT_PUBLIC_SUPABASE_URL`  
Supabase project URL.

`NEXT_PUBLIC_SUPABASE_ANON_KEY`  
Supabase anon key for public reads.

`SUPABASE_SERVICE_ROLE_KEY`  
Server-only key for trusted writes.

`STRIPE_SECRET_KEY`  
Server-only Stripe API key.

`STRIPE_WEBHOOK_SECRET`  
Webhook signing secret used to verify Stripe events.

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
Optional client key for future embedded payment UI.

`CHAIN_ID`  
`8453` for Base, `84532` for Base Sepolia (testing). Moonbeam (1284/1287) shut down in 2026 and is refused.

`CHAIN_RPC_URL`  
Optional. Defaults to Base's public endpoint for `CHAIN_ID`; use a provider endpoint in production.

`CHAIN_OPERATOR_PRIVATE_KEY`  
Server-only key of the wallet that pays for records. Keep a small ETH balance on Base.

`ANCHOR_MODE`  
Optional. `batch` (default) writes one Merkle root an hour for every waiting tip; `single` writes each tip in its own transaction.

`OTS_CALENDARS`  
Optional. Comma-separated OpenTimestamps calendar URLs for the free Bitcoin backup. Defaults to the public calendars.

`CHAIN_LOW_BALANCE`  
Optional. Warning threshold in ETH for `/api/health/operator-wallet` (default 0.002).

`GRATIFI_PROTOCOL_CONTRACT_ADDRESS`  
Deployed contract address.

`MIN_TIP_AMOUNT_PENCE` / `MAX_TIP_AMOUNT_PENCE`  
Server-side payment amount limits.
