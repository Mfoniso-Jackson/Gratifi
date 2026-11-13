import type Stripe from "stripe";
import { beforeEach, describe, expect, it } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { checkoutParams, subscriptionRow, trialEndFor } from "@/lib/billing/BillingService";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";

const VENUE = "de30a001-0000-4000-8000-000000000001";
const now = new Date("2026-11-13T12:00:00Z");
const venue = { id: VENUE, name: "Juniper & Oak", created_at: "2026-11-03T12:00:00Z" }; // 20 pilot days left

function subscription(overrides: Partial<Stripe.Subscription> = {}, metadata: Record<string, string> = {}) {
  return {
    id: "sub_123",
    object: "subscription",
    customer: "cus_123",
    status: "trialing",
    trial_end: 1_765_000_000,
    items: { data: [{ current_period_end: 1_766_000_000 }] },
    metadata: { kind: "venue_subscription", venueId: VENUE, plan: "pro", interval: "year", payrollAddon: "false", ...metadata },
    ...overrides
  } as unknown as Stripe.Subscription;
}

describe("subscription checkout", () => {
  it("starts billing when the pilot ends, with the plan in metadata", () => {
    const params = checkoutParams({ venue, plan: "pro", interval: "month", payrollAddon: false, email: "owner@example.com", now });
    expect(params.mode).toBe("subscription");
    expect(params.line_items).toHaveLength(1);
    expect(params.line_items?.[0].price_data).toMatchObject({ unit_amount: 7900, recurring: { interval: "month" } });
    expect(params.subscription_data?.trial_end).toBe(Math.floor(Date.parse("2026-12-03T12:00:00Z") / 1000));
    expect(params.subscription_data?.metadata).toMatchObject({ venueId: VENUE, plan: "pro", payrollAddon: "false" });
    expect(params.customer_email).toBe("owner@example.com");
  });

  it("adds the payroll add-on to Starter only, and charges yearly at ten months", () => {
    const starter = checkoutParams({ venue, plan: "starter", interval: "year", payrollAddon: true, now });
    expect(starter.line_items?.map((item) => item.price_data?.unit_amount)).toEqual([29000, 40000]);
    const pro = checkoutParams({ venue, plan: "pro", interval: "month", payrollAddon: true, now });
    expect(pro.line_items).toHaveLength(1);
  });

  it("skips the trial when less than two days of pilot are left, and reuses a known customer", () => {
    expect(trialEndFor("2026-10-15T12:00:00Z", now)).toBeUndefined();
    const params = checkoutParams({ venue, plan: "starter", interval: "month", payrollAddon: false, customerId: "cus_9", email: "x@y.z", now });
    expect(params.customer).toBe("cus_9");
    expect(params.customer_email).toBeUndefined();
  });

  it("refuses the Group plan online", () => {
    expect(() => checkoutParams({ venue, plan: "group", interval: "month", payrollAddon: false, now })).toThrow();
  });
});

describe("subscription webhooks", () => {
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
  });

  it("maps a Stripe subscription to a venue row, reading the period end from items", () => {
    expect(subscriptionRow(subscription())).toMatchObject({
      venue_id: VENUE,
      plan: "pro",
      billing_interval: "year",
      status: "trialing",
      stripe_customer_id: "cus_123",
      current_period_end: new Date(1_766_000_000 * 1000).toISOString()
    });
    expect(subscriptionRow(subscription({}, { kind: "something_else" }))).toBeNull();
  });

  it("keeps the venue's plan in step through created, updated and cancelled", async () => {
    const db = createDemoClient({ env: {} });
    const deps = { db, createRecognition: async () => ({}) };
    const send = (type: string, sub: Stripe.Subscription) =>
      handleStripeEvent({ id: "evt", object: "event", type, data: { object: sub } } as unknown as Stripe.Event, deps);

    expect((await send("customer.subscription.created", subscription())).action).toBe("subscription_saved");
    await send("customer.subscription.updated", subscription({ status: "active" }));
    await send("customer.subscription.deleted", subscription({ status: "canceled" }));

    const rows = (await db.from("venue_subscriptions").select("*").eq("venue_id", VENUE)).data;
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("canceled");
  });

  it("leaves subscription checkouts to the subscription events", async () => {
    const outcome = await handleStripeEvent(
      { id: "evt", object: "event", type: "checkout.session.completed", data: { object: { mode: "subscription" } } } as unknown as Stripe.Event,
      { db: createDemoClient({ env: {} }), createRecognition: async () => ({}) }
    );
    expect(outcome.action).toBe("ignored");
  });
});
