import type Stripe from "stripe";
import { tipFromSession } from "@/lib/payments/fees";

/**
 * What the thank-you page shows after a real Stripe payment. Stripe redirects with ?session_id=,
 * and the recognition itself is created by the webhook, which can land a moment after the redirect.
 */
export type Receipt =
  | { state: "recorded"; event: any; dreamContribution: { from_tip_pence: number; match_pence: number } | null }
  | { state: "recording"; event: any; dreamContribution?: { from_tip_pence: number; match_pence: number } | null }
  | { state: "unpaid"; workerId: string | null }
  | { state: "invalid" };

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

export function isCheckoutSessionId(value: string | undefined | null): value is string {
  return Boolean(value && SESSION_ID.test(value));
}

export async function loadReceipt(
  db: any,
  sessionId: string | undefined,
  retrieveSession: (id: string) => Promise<Stripe.Checkout.Session>
): Promise<Receipt> {
  if (!isCheckoutSessionId(sessionId)) return { state: "invalid" };
  let session: Stripe.Checkout.Session;
  try {
    session = await retrieveSession(sessionId);
  } catch {
    return { state: "invalid" };
  }
  // Only tip checkouts belong on this page (subscriptions return to the billing page).
  if (session.mode !== "payment" || !session.metadata?.workerId) return { state: "invalid" };
  if (session.payment_status !== "paid") return { state: "unpaid", workerId: session.metadata.workerId };

  const intentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const recorded = intentId
    ? (await db.from("recognition_events").select("*, workers(display_name), venues(name, slug, referral_code)").eq("stripe_payment_intent_id", intentId).maybeSingle()).data
    : null;
  if (recorded) {
    const contribution = (await db.from("dream_contributions").select("from_tip_pence, match_pence").eq("recognition_event_id", recorded.id).maybeSingle()).data ?? null;
    // Saved, but only "recorded" once the on-chain write is confirmed (it may be waiting to retry).
    if (recorded.anchor_status !== "confirmed") return { state: "recording", event: recorded, dreamContribution: contribution };
    return { state: "recorded", event: recorded, dreamContribution: contribution };
  }

  // Paid, but the webhook hasn't recorded it yet: show what the customer paid from the session itself.
  const worker = (await db.from("workers").select("display_name, venues(name, slug, referral_code)").eq("id", session.metadata.workerId).maybeSingle()).data;
  return {
    state: "recording",
    event: {
      id: null,
      worker_id: session.metadata.workerId,
      venue_id: session.metadata.venueId ?? null,
      amount_pence: tipFromSession(session),
      message: session.metadata.message || null,
      recognition_hash: null,
      workers: worker ? { display_name: worker.display_name } : null,
      venues: worker?.venues ?? null
    }
  };
}
