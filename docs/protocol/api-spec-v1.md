# API Specification v1

The current API is internal but shaped for a future public API and SDK.

All responses use a protocol envelope:

```json
{
  "object": "gratifi.protocol.response",
  "apiVersion": "v1",
  "data": {},
  "meta": {}
}
```

Errors use:

```json
{
  "object": "gratifi.protocol.error",
  "apiVersion": "v1",
  "error": {
    "message": "Error message",
    "status": 400
  }
}
```

## GET /api/v1/venues

Returns active venues.

Example response:

```json
{
  "object": "gratifi.protocol.response",
  "apiVersion": "v1",
  "data": [
    {
      "id": "venue_uuid",
      "slug": "demo-cafe",
      "name": "Demo Cafe",
      "status": "active"
    }
  ],
  "meta": {}
}
```

## POST /api/v1/venues

Creates or updates a venue.

Example request:

```json
{
  "slug": "demo-cafe",
  "name": "Demo Cafe",
  "address": "1 Recognition Street",
  "status": "active"
}
```

## GET /api/v1/workers?venueId=...

Returns active workers for a venue.

Example response:

```json
{
  "object": "gratifi.protocol.response",
  "apiVersion": "v1",
  "data": [
    {
      "id": "worker_uuid",
      "venue_id": "venue_uuid",
      "display_name": "Maya",
      "role": "Barista",
      "status": "active"
    }
  ],
  "meta": {}
}
```

## POST /api/v1/workers

Creates or updates a worker.

Example request:

```json
{
  "venue_id": "venue_uuid",
  "display_name": "Maya",
  "role": "Barista",
  "status": "active"
}
```

## GET /api/v1/recognitions

Returns recent recognition events for admin/protocol use.

Future public versions should require API keys and scoped permissions.

## POST /api/v1/recognitions

Starts the recognition payment flow.

Current implementation accepts form data from the customer tip page and redirects to Stripe Checkout.

Canonical input:

```json
{
  "venueId": "venue_uuid",
  "workerId": "worker_uuid",
  "amountPence": 500,
  "message": "Thank you"
}
```

The frontend must not decide payment success. Final event creation happens only after Stripe webhook verification.

## GET /api/v1/verify/[recognitionHash]

Verifies a recognition by hash.

Example response:

```json
{
  "object": "gratifi.protocol.response",
  "apiVersion": "v1",
  "data": {
    "recognition_hash": "0x...",
    "moonbeam_status": "confirmed",
    "moonbeam_tx_hash": "0xabc123...",
    "moonbeam_block_number": 1234567,
    "confirmed_at": "2026-07-09T10:00:30.000Z",
    "protocol_version": "gratifi-v1"
  },
  "meta": {}
}
```

## Future SDK Notes

A future SDK should provide:

- venue lookup;
- worker lookup;
- recognition verification;
- typed response models;
- retry-safe webhook helpers;
- hash generation utilities matching `hashing-standard.md`.
