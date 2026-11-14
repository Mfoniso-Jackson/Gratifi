# Privacy and Governance

## Privacy Principles

GratiFi v1 is designed around data minimisation.

- No customer wallets.
- No customer account requirement.
- No raw personal data on-chain.
- No raw thank-you messages on-chain.
- No reputation scoring in v1.
- No public social feed.
- No NFTs.
- No token requirement.

## Customer Dignity

Recognition should feel like a simple thank-you, not a financial or crypto interaction.

The customer-facing UX must avoid:

- wallet language;
- gas language;
- token language;
- speculative rewards;
- pressure to tip;
- public ranking or reputation mechanics.

## On-Chain Data

The GratiFiProtocol contract (on Base) stores hashes and amount data required for verification. It does not store:

- customer names;
- customer emails;
- payment card details;
- raw messages;
- raw venue IDs;
- raw worker IDs.

## Operational Data

Supabase stores operational records needed to run the product:

- venues;
- workers;
- recognition events;
- pilot status;
- evidence and feedback notes.

Access to admin data should be limited to authorised operators.

## Venue and Operator Responsibilities

Operators are responsible for:

- accurate worker information;
- QR placement consent;
- respectful staff training;
- evidence permissions;
- quote usage permissions;
- secure handling of exported pilot data.

## Future KILT Integration Principles

KILT is not implemented in v1.

If KILT is added later, it should support:

- optional venue attestations;
- optional worker eligibility or role attestations;
- privacy-preserving verification;
- revocable credentials;
- no forced public identity exposure.

KILT credentials should strengthen trust without making the customer experience more complex.

## Governance Direction

v1 is operator-governed. Future governance must be introduced only after:

- protocol usage is proven;
- data and privacy requirements are clear;
- contract upgrade and treasury risks are documented;
- venues and workers are not forced into speculative mechanics.
