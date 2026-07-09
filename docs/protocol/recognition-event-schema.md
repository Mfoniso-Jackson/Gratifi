# Recognition Event Schema

`RecognitionEvent` is the canonical protocol record for a payment-verified recognition.

## Canonical Fields

| Field | Type | Visibility | Required | Notes |
| --- | --- | --- | --- | --- |
| `id` | UUID | Private operational | Yes | Supabase primary key. Not submitted on-chain. |
| `venue_id` | UUID | Private operational, hashed on-chain | Yes | Identifies the venue in Supabase. Submitted to Moonbeam only as `venueHash`. |
| `worker_id` | UUID | Private operational, hashed on-chain | Yes | Identifies the worker in Supabase. Submitted to Moonbeam only as `workerHash`. |
| `amount_pence` | Integer | Public verification | Yes | Stored in Supabase and on-chain. |
| `currency` | String | Public verification | Yes | v1 default is `GBP`. |
| `message_hash` | Bytes32 string | Public verification | Yes | Hash of trimmed message text. Raw message is not sent on-chain. |
| `recognition_hash` | Bytes32 string | Public verification | Yes | Canonical deterministic event hash. Unique in Supabase and Moonbeam. |
| `stripe_payment_reference` | String | Private operational | Yes | Stripe PaymentIntent or Checkout payment reference. Stored as `stripe_payment_intent_id` in the current implementation. |
| `moonbeam_tx_hash` | String | Public verification | Optional | Present after successful anchoring. |
| `block_number` | Integer | Public verification | Optional | Stored as `moonbeam_block_number` in the current implementation. |
| `contract_address` | String | Public verification | Optional | Stored as `moonbeam_contract_address` in the current implementation. |
| `protocol_version` | String | Public verification | Yes | Current value: `gratifi-v1`. |
| `status` | String | Public operational | Yes | Derived from `moonbeam_status`: `pending`, `confirmed`, `failed`, or `retry`. |
| `created_at` | Timestamp | Public operational | Yes | Recognition creation time. |
| `confirmed_at` | Timestamp | Public verification | Optional | Set after Moonbeam anchoring confirmation. |

## Current Database Mapping

The Supabase table is `recognition_events`.

Current column names:

- `stripe_payment_intent_id` maps to `stripe_payment_reference`.
- `moonbeam_block_number` maps to `block_number`.
- `moonbeam_contract_address` maps to `contract_address`.
- `moonbeam_status` maps to `status`.

## Public, Private, Hashed, Optional

Public verification fields:

- `amount_pence`
- `currency`
- `message_hash`
- `recognition_hash`
- `moonbeam_tx_hash`
- `block_number`
- `contract_address`
- `protocol_version`
- `status`
- `created_at`
- `confirmed_at`

Private operational fields:

- `id`
- `venue_id`
- `worker_id`
- `stripe_payment_reference`

Hashed before chain submission:

- `venue_id`
- `worker_id`
- raw message text

Optional until anchoring completes:

- `moonbeam_tx_hash`
- `block_number`
- `contract_address`
- `confirmed_at`

## Example

```json
{
  "id": "8ed0f7fd-6eb7-4f3a-a31d-73609f3eb423",
  "venue_id": "4d6768d4-3d2b-48ce-a383-ecdaea9b92ce",
  "worker_id": "76432e77-fbc9-4b8f-91cf-b78b3ad58b4c",
  "amount_pence": 500,
  "currency": "GBP",
  "message_hash": "0x5f4dcc3b5aa765d61d8327deb882cf99...",
  "recognition_hash": "0x8d2af5f6b2c1d0e9...",
  "stripe_payment_reference": "pi_123",
  "moonbeam_tx_hash": "0xabc123...",
  "block_number": 1234567,
  "contract_address": "0xProtocolContract",
  "protocol_version": "gratifi-v1",
  "status": "confirmed",
  "created_at": "2026-07-09T10:00:00.000Z",
  "confirmed_at": "2026-07-09T10:00:30.000Z"
}
```
