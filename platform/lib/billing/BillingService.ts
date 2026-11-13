import type Stripe from "stripe";
import { appConfig } from "@/lib/config";
import { PILOT_DAYS, PLANS, PAYROLL_ADDON_PENCE, priceFor, type BillingInterval, type PlanId } from "@/lib/billing/plans";

/**
 * Venue subscriptions on Stripe Billing. Prices are created inline, so nothing has to be set up in the
 * Stripe dashboard except the customer portal (for "Manage billing") and the webhook events.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
// Stripe needs a trial to end at least 48 hours ahead; shorter remainders start billing straight away.
const MIN_TRIAL_MS = 2 * DAY_MS + 60 * 60 * 1000;

export interface CheckoutRequest {
  venue: { id: string; name: string; created_at: string };
  plan: PlanId;
  interval: BillingInterval;
  payrollAddon: boolean;
  customerId?: string | null;
  email?: string | null;
  now?: Date;
}

/** The pilot's end as a Stripe trial_end (unix seconds), or undefined when too little of it is left. */
export function trialEndFor(venueCreatedAt: string, now = new Date()) {
  const ends = Date.parse(venueCreatedAt) + PILOT_DAYS * DAY_MS;
  return ends - now.getTime() >= MIN_TRIAL_MS ? Math.floor(ends / 1000) : undefined;
}

export function checkoutParams(request: CheckoutRequest): Stripe.Checkout.SessionCreateParams {
  const plan = PLANS[request.plan];
  if (!plan?.selfServe) throw new Error("This plan isn't available to buy online.");
  const metadata = {
    kind: "venue_subscription",
    venueId: request.venue.id,
    plan: plan.id,
    interval: request.interval,
    payrollAddon: String(request.payrollAddon && !plan.includesPayroll)
  };
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: priceFor(plan.id, request.interval),
        recurring: { interval: request.interval },
        product_data: { name: `GratiFi ${plan.name}` }
      }
    }
  ];
  if (metadata.payrollAddon === "true") {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: request.interval === "year" ? PAYROLL_ADDON_PENCE * 10 : PAYROLL_ADDON_PENCE,
        recurring: { interval: request.interval },
        product_data: { name: "GratiFi payroll export" }
      }
    });
  }

  const billingPage = `${appConfig.appUrl}/admin/billing?venueId=${request.venue.id}`;
  return {
    mode: "subscription",
    line_items: lineItems,
    client_reference_id: request.venue.id,
    metadata,
    subscription_data: { metadata, trial_end: trialEndFor(request.venue.created_at, request.now) },
    ...(request.customerId ? { customer: request.customerId } : request.email ? { customer_email: request.email } : {}),
    success_url: `${billingPage}&status=success`,
    cancel_url: billingPage
  };
}

const toIso = (seconds: number | null | undefined) => (seconds ? new Date(seconds * 1000).toISOString() : null);

/** Maps a Stripe subscription to a venue_subscriptions row, or null if it isn't a GratiFi venue subscription. */
export function subscriptionRow(subscription: Stripe.Subscription) {
  const meta = subscription.metadata ?? {};
  if (meta.kind !== "venue_subscription" || !meta.venueId || !(meta.plan in PLANS)) return null;
  const sub = subscription as Stripe.Subscription & { current_period_end?: number };
  // Newer Stripe API versions report the period end on each item instead of the subscription.
  const periodEnd = sub.current_period_end ?? (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end;
  return {
    venue_id: meta.venueId,
    plan: meta.plan as PlanId,
    billing_interval: (meta.interval === "year" ? "year" : "month") as BillingInterval,
    status: subscription.status,
    payroll_addon: meta.payrollAddon === "true",
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
    stripe_subscription_id: subscription.id,
    trial_end: toIso(subscription.trial_end),
    current_period_end: toIso(periodEnd),
    updated_at: new Date().toISOString()
  };
}

export async function saveSubscription(db: any, subscription: Stripe.Subscription) {
  const row = subscriptionRow(subscription);
  if (!row) return false;
  const result = await db.from("venue_subscriptions").upsert(row, { onConflict: "venue_id" });
  if (result.error) throw result.error;
  return true;
}
