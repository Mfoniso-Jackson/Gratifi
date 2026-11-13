# Stripe Webhook Guide

GratiFi trusts only server-verified Stripe events. The frontend never decides whether a payment succeeded.

Create a webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

For "Manage billing" to work, switch on the customer portal in the Stripe dashboard (Settings, Billing, Customer portal).

The webhook handler:

1. Verifies the Stripe signature.
2. Reads venue, worker, and message metadata from the Checkout Session.
3. Creates the recognition event through `RecognitionEngine`.
4. Stores and anchors the recognition.
5. Marks failed chain writes as `retry`.

Refunds and disputes update the recognition's `stripe_status` (`refunded`, `partially_refunded`, `disputed`, `dispute_won`, `dispute_lost`). The record stays in the ledger and on Moonbeam, but refunded, partially refunded, disputed and lost tips no longer count toward tip totals.

A request with a missing or invalid signature gets a 400 response and changes nothing.
