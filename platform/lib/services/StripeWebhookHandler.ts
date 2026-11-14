import type Stripe from "stripe";
import type { RecognitionPayload } from "@/lib/types/domain";
import { saveSubscription } from "@/lib/billing/BillingService";
import { applySponsorInvoiceEvent } from "@/lib/sponsors/InvoiceService";
import { tipFromSession } from "@/lib/payments/fees";

/**
 * Applies a verified Stripe event to GratiFi's records.
 *
 * - checkout.session.completed: creates the recognition (RecognitionEngine is idempotent per payment).
 * - charge.refunded: marks the recognition "refunded" (full refunds) or "partially_refunded".
 * - charge.dispute.created: marks it "disputed"; charge.dispute.closed: "dispute_won" or "dispute_lost".
 * - customer.subscription.created/updated/deleted: keeps venue_subscriptions in step with Stripe Billing.
 *
 * Refunded or disputed tips stay in the ledger and on-chain (the chain record cannot be removed),
 * but they are excluded from tip totals.
 */
export interface WebhookDeps {
  db: any;
  createRecognition: (payload: RecognitionPayload) => Promise<unknown>;
  /** Present only while the Dream Fund is switched on. */
  applyDreamTip?: (input: { workerId: string; amountPence: number; recognitionId: string | null }) => Promise<unknown>;
}

export type WebhookOutcome =
  | { action: "recognition_created" }
  | { action: "status_updated"; paymentIntentId: string; stripeStatus: string }
  | { action: "subscription_saved"; subscriptionId: string }
  | { action: "sponsor_invoice_updated"; invoiceId: string }
  | { action: "ignored"; reason: string };

/** Stripe statuses that no longer count as money given to staff. */
export const REVERSED_STRIPE_STATUSES = ["refunded", "partially_refunded", "disputed", "dispute_lost"];

function paymentIntentId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function setStripeStatus(db: any, intentId: string, stripeStatus: string): Promise<WebhookOutcome> {
  const result = await db
    .from("recognition_events")
    .update({ stripe_status: stripeStatus })
    .eq("stripe_payment_intent_id", intentId)
    .select("id");
  if (result.error) throw result.error;
  if (!result.data || result.data.length === 0) {
    return { action: "ignored", reason: `No recognition for payment ${intentId}` };
  }
  return { action: "status_updated", paymentIntentId: intentId, stripeStatus };
}

export async function handleStripeEvent(event: Stripe.Event, deps: WebhookDeps): Promise<WebhookOutcome> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Subscription checkouts are recorded from the customer.subscription.* events that follow.
      if (session.mode === "subscription") return { action: "ignored", reason: "Subscription checkout" };
      const intentId = paymentIntentId(session.payment_intent as string | Stripe.PaymentIntent | null);
      const { venueId, workerId, message } = session.metadata ?? {};
      // Only the tip is recorded; a card fee the customer chose to cover is not part of it.
      const tipPence = tipFromSession(session);
      if (!intentId || !venueId || !workerId || !tipPence) {
        return { action: "ignored", reason: "Checkout session is missing GratiFi metadata" };
      }
      const recognition = await deps.createRecognition({
        venueId,
        workerId,
        amountPence: tipPence,
        currency: "GBP",
        message: message ?? null,
        stripePaymentIntentId: intentId,
        stripeStatus: session.payment_status
      });
      if (session.metadata?.dreamLinked === "true" && deps.applyDreamTip) {
        await deps.applyDreamTip({
          workerId,
          amountPence: tipPence,
          recognitionId: (recognition as { id?: string } | null)?.id ?? null
        });
      }
      return { action: "recognition_created" };
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const intentId = paymentIntentId(charge.payment_intent as string | Stripe.PaymentIntent | null);
      if (!intentId) return { action: "ignored", reason: "Refunded charge has no payment intent" };
      const full = charge.amount_refunded >= charge.amount;
      return setStripeStatus(deps.db, intentId, full ? "refunded" : "partially_refunded");
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const intentId = paymentIntentId(dispute.payment_intent as string | Stripe.PaymentIntent | null);
      if (!intentId) return { action: "ignored", reason: "Dispute has no payment intent" };
      return setStripeStatus(deps.db, intentId, "disputed");
    }

    case "charge.dispute.closed": {
      const dispute = event.data.object as Stripe.Dispute;
      const intentId = paymentIntentId(dispute.payment_intent as string | Stripe.PaymentIntent | null);
      if (!intentId) return { action: "ignored", reason: "Dispute has no payment intent" };
      return setStripeStatus(deps.db, intentId, dispute.status === "won" ? "dispute_won" : "dispute_lost");
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const saved = await saveSubscription(deps.db, subscription);
      return saved
        ? { action: "subscription_saved", subscriptionId: subscription.id }
        : { action: "ignored", reason: "Not a GratiFi venue subscription" };
    }

    case "invoice.paid":
    case "invoice.voided":
    case "invoice.marked_uncollectible": {
      const invoice = event.data.object as Stripe.Invoice;
      return (await applySponsorInvoiceEvent(deps.db, event.type, invoice))
        ? { action: "sponsor_invoice_updated", invoiceId: invoice.id as string }
        : { action: "ignored", reason: "Not a sponsor invoice" };
    }

    default:
      return { action: "ignored", reason: `Unhandled event type ${event.type}` };
  }
}
