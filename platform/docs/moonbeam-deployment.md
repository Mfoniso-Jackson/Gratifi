# Moonbeam Deployment Guide

Compile the contract:

```bash
pnpm hardhat:compile
```

Deploy to Moonbase first:

```bash
pnpm hardhat run scripts/deploy-moonbeam.ts --network moonbase
```

Deploy to Moonbeam mainnet:

```bash
pnpm hardhat run scripts/deploy-moonbeam.ts --network moonbeam
```

After deployment:

1. Set `GRATIFI_PROTOCOL_CONTRACT_ADDRESS`.
2. Ensure `MOONBEAM_OPERATOR_PRIVATE_KEY` belongs to the contract owner or an authorised operator.
3. Confirm `/admin/protocol` can read `getRecognitionCount()`.
4. Run a small test recognition through Stripe test mode before accepting live payments.
