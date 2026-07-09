# Future Token Readiness

## Position

GratiFi is token-ready but not token-dependent.

No token is implemented in v1. Recognition events, venue onboarding, QR deployment, payments, Supabase storage, and Moonbeam anchoring all work without a token.

## Why Token-Ready Architecture Matters

The system records canonical recognition events with:

- deterministic hashes;
- protocol versions;
- payment verification;
- venue and worker context;
- on-chain anchors.

This gives future modules a reliable event base without requiring a redesign.

## Possible Future Modules

### ProtocolToken

A future token could represent protocol coordination or utility. It is not required for v1 recognition.

### VenueStaking

Venues or operators could stake to access advanced protocol features. This would require careful governance and risk controls.

### RecognitionRewards

Rewards could be derived from verified recognition events. Any reward system must avoid manipulative incentives and preserve worker dignity.

### Governance

Governance could manage protocol parameters, grants, treasury use, or operator permissions.

### Treasury

A treasury could fund pilots, integrations, ecosystem grants, and public-good recognition tooling.

### DeveloperSDK

A public SDK can expose venue, worker, recognition, verification, and hashing utilities before any token module exists.

## Current Architecture Support

v1 already supports future modules through:

- `protocol_version`;
- deterministic `recognition_hash`;
- Moonbeam contract anchoring;
- clear API versioning;
- isolated service layers;
- Supabase ledger history;
- admin retry and verification flows.

## Non-Goals for v1

v1 does not include:

- token issuance;
- token rewards;
- staking;
- treasury;
- governance voting;
- speculative incentives.

Future token work should follow demonstrated venue usage, security review, and a separate protocol specification.
