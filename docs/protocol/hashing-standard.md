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
8. The same normalised payload must always produce the same `recognition_hash`.

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
keccak256(utf8(trimmedMessage))
```

Blank messages are represented by the hash of an empty string.

## Entity Hashes

Venue and worker IDs are operational identifiers. They are not submitted directly to Moonbeam.

```text
venueHash = keccak256(utf8(venue_id))
workerHash = keccak256(utf8(worker_id))
```

## Recognition Hash Payload

Canonical payload shape:

```json
{
  "protocolVersion": "gratifi-v1",
  "venueId": "4d6768d4-3d2b-48ce-a383-ecdaea9b92ce",
  "workerId": "76432e77-fbc9-4b8f-91cf-b78b3ad58b4c",
  "amountPence": 500,
  "currency": "GBP",
  "messageHash": "0x...",
  "stripePaymentIntentId": "pi_123"
}
```

The implementation serialises the normalised object with stable ordering and hashes the resulting UTF-8 JSON string:

```text
recognitionHash = keccak256(utf8(JSON.stringify(normalizedPayload)))
```

## Example

```ts
const normalized = {
  protocolVersion: "gratifi-v1",
  venueId: "4d6768d4-3d2b-48ce-a383-ecdaea9b92ce",
  workerId: "76432e77-fbc9-4b8f-91cf-b78b3ad58b4c",
  amountPence: 500,
  currency: "GBP",
  messageHash: "0x...",
  stripePaymentIntentId: "pi_123"
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
- message trimming behaviour.

Any breaking change requires a new `protocol_version`.
