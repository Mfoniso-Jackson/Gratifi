# Hashing Standard

## Purpose

Hashing gives each recognition a deterministic identity while keeping private operational data out of the public contract state.

## Rules

1. Normalise the recognition payload before hashing.
2. Use stable field ordering.
3. Trim message text before hashing.
4. Hash `venue_id` before chain submission.
5. Hash `worker_id` before chain submission.
6. Hash the message instead of storing the raw message on-chain.
7. `recognition_hash` must uniquely identify a recognition event.
8. The same normalised payload and salt must always produce the same `recognition_hash`.
9. Every recognition has its own random 32-byte salt, mixed into the message, venue and worker hashes and included in the recognition hash payload. The salt is kept in a server-only table (`recognition_salts`) that signed-in staff and owners cannot read, and never leaves GratiFi's database.

## Why salts (protocol `gratifi-v2`)

Without a salt, a short note such as "Thanks!" could be matched to its hash by guessing, and a worker's
on-chain records could be linked through their public tip-page ID. With a per-recognition salt:

- guessing a note or linking a worker's records is not possible without the salt;
- the same note on two tips hashes differently;
- erasing the salt (on a UK GDPR deletion request) permanently unlinks the on-chain fingerprint from
  the person, even though the fingerprint itself can never be removed.

Recognitions created before `gratifi-v2` (protocol `gratifi-v1`) used the unsalted forms below.

## Message Hash

Input:

```text
Thank you for great service
```

Normalisation:

```text
Thank you for great service
```

Hash:

```text
keccak256(salt || utf8(trimmedMessage))        // gratifi-v2
keccak256(utf8(trimmedMessage))                // gratifi-v1
```

`salt` is the recognition's 32 random bytes, prepended before hashing. Blank messages are hashed as an
empty string with the same salt.

## Entity Hashes

Venue and worker IDs are operational identifiers. They are not submitted directly on-chain.

```text
venueHash = keccak256(salt || utf8(venue_id))     // gratifi-v2
workerHash = keccak256(salt || utf8(worker_id))   // gratifi-v2
```

## Recognition Hash Payload

Canonical payload shape:

```json
{
  "protocolVersion": "gratifi-v2",
  "venueId": "4d6768d4-3d2b-48ce-a383-ecdaea9b92ce",
  "workerId": "76432e77-fbc9-4b8f-91cf-b78b3ad58b4c",
  "amountPence": 500,
  "currency": "GBP",
  "messageHash": "0x...",
  "stripePaymentIntentId": "pi_123",
  "salt": "0x…32 random bytes…"
}
```

The implementation serialises the normalised object with stable ordering and hashes the resulting UTF-8 JSON string:

```text
recognitionHash = keccak256(utf8(JSON.stringify(normalizedPayload)))
```

## Example

```ts
const normalized = {
  protocolVersion: "gratifi-v2",
  venueId: "4d6768d4-3d2b-48ce-a383-ecdaea9b92ce",
  workerId: "76432e77-fbc9-4b8f-91cf-b78b3ad58b4c",
  amountPence: 500,
  currency: "GBP",
  messageHash: "0x...",
  stripePaymentIntentId: "pi_123",
  salt
};

const recognitionHash = keccak256(utf8(JSON.stringify(normalized)));
```

## Stability Requirements

Future SDKs must preserve:

- field names;
- field ordering;
- currency casing;
- amount denomination in pence;
- protocol version;
- message trimming behaviour;
- one random salt per recognition, kept private.

Any breaking change requires a new `protocol_version`.
