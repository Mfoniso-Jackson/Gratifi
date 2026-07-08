# Future Token Readiness

GratiFi v1.0 does not implement a token.

The architecture intentionally leaves clear extension points:

- `ProtocolToken`
- `VenueStaking`
- `RecognitionRewards`
- `Governance`
- `Treasury`
- `DeveloperSDK`
- Public API keys

## Design Principles

- Recognition events are useful without a token.
- Token rewards can be derived later from existing recognition hashes.
- Venue and worker identities are separated from chain-visible data through hashes.
- The API is versioned before becoming public.
- The recognition ledger keeps enough canonical data to support future rewards and governance without rewriting the MVP schema.
