# Stripe Webhook Guide

GratiFi trusts only server-verified Stripe events. The frontend never decides whether a payment succeeded.

Create a webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`

The webhook handler:

1. Verifies the Stripe signature.
2. Reads venue, worker, and message metadata from the Checkout Session.
3. Creates the recognition event through `RecognitionEngine`.
4. Stores and anchors the recognition.
5. Marks failed chain writes as `retry`.
