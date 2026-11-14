# Base deployment guide

GratiFi writes each paid tip's fingerprint (a hash, never names or notes) to the `GratiFiProtocol`
contract on **Base**, Coinbase's Ethereum layer 2. Moonbeam, the previous network, shut down in
mid-2026. Records written there before the shutdown keep their transaction hashes in the database and
show as "Moonbeam (retired)".

## 1. Test network first (Base Sepolia)

1. Create a new operator wallet just for GratiFi. Never reuse a personal wallet.
2. Get free Base Sepolia ETH from a faucet (for example Coinbase Developer Platform's faucet).
3. Set `CHAIN_ID=84532` and `CHAIN_OPERATOR_PRIVATE_KEY` in `.env.local`.
4. Deploy:

   ```bash
   npm run hardhat:compile
   npm run deploy:base-sepolia
   ```

5. Set `GRATIFI_PROTOCOL_CONTRACT_ADDRESS` to the printed address.
6. Optional: verify the source on Basescan with `ETHERSCAN_API_KEY` set:
   `npx hardhat verify --network baseSepolia <address> <operator address>`.
7. Run a Stripe test-mode tip and check that `/admin/protocol` shows it recorded, and that the Tips page
   "View" link opens it on sepolia.basescan.org.

## 2. Base mainnet

1. Fund the operator wallet with a small amount of ETH **on Base** (not Ethereum mainnet). 0.01 ETH
   covers thousands of records at 2026 fees; `/api/health/operator-wallet` warns below
   `CHAIN_LOW_BALANCE` (default 0.002 ETH).
2. Set `CHAIN_ID=8453` and, for production, `CHAIN_RPC_URL` from a provider (Alchemy, QuickNode or
   Coinbase Developer Platform). The public `https://mainnet.base.org` endpoint is rate limited.
3. `npm run deploy:base`, then update `GRATIFI_PROTOCOL_CONTRACT_ADDRESS`.
4. Remove any old `MOONBEAM_*` variables. `npm run check-env` (scripts/check-env.mjs) flags them.

## 3. Moving an existing deployment off Moonbeam

1. Apply `supabase/migrations/010_move_record_to_base.sql`. It renames the `moonbeam_*` columns to
   `anchor_*` and marks every already-confirmed record as written to Moonbeam (chain 1284).
2. Deploy the contract to Base and set the variables above.
3. Tips that were waiting (pending or retry) because Moonbeam stopped are written to Base by the
   retry job (`/api/cron/retry-anchoring`), or with "Retry now" on the Tips page.

The app refuses to write to a retired network: with `CHAIN_ID` still set to 1284 or 1287, tips stay
in "retry" and the Protocol page shows a warning.

## 4. Hourly batches and the Bitcoin backup

With `ANCHOR_MODE=batch` (the default), tips aren't written one by one. Once an hour the job at
`/api/cron/retry-anchoring`:

1. collects every tip waiting for its record (`pending` or `retry`);
2. builds a Merkle tree of their hashes (`lib/anchoring/merkle.ts`; leaf = keccak256(hash), pairs
   hashed in sorted order, the same as OpenZeppelin's `MerkleProof`);
3. writes the root with the contract's `recordBatch` (one transaction, about 720 a month);
4. saves each tip's proof (`recognition_events.merkle_proof`) and the batch (`anchor_batches`);
5. sends the root's SHA-256 to OpenTimestamps calendars, which commit it to Bitcoin for free.

If the Base write fails, the tips go back to `retry` for the next run. If the calendars are down,
the Base record still stands and the Bitcoin backup is retried on later runs.

**Running it hourly.** Vercel's free plan only runs scheduled jobs daily (`vercel.json` keeps a daily
run as a fallback). `.github/workflows/anchor-hourly.yml` calls the job every hour: add the
repository secrets `GRATIFI_APP_URL` and `CRON_SECRET` to switch it on.

**Checking a tip.** `GET /api/v1/verify/<recognitionHash>` returns the batch root, the tip's proof and
whether it checks out. Anyone can also call `verifyInBatch(hash, root, proof)` on the contract. For
the Bitcoin backup, download `root` and `.ots` from the links in the response, then:

```bash
pip install opentimestamps-client
ots upgrade root.bin.ots
ots verify root.bin.ots
```

The contract gained `recordBatch`, `verifyInBatch`, `isBatchRecorded`, `getBatch` and
`getBatchCount`, so deploy this version (it is a new contract; Base hasn't been deployed to yet).
