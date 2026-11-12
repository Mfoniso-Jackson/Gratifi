import Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";
import { POST } from "@/app/api/stripe/webhook/route";

const VENUE = "de30a001-0000-4000-8000-000000000001";
const WORKER = "de30b002-0000-4000-8000-000000000001";
const SECRET = "whsec_test_secret";

function freshDemoData() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: `evt_${type}`, object: "event", type, data: { object } } as unknown as Stripe.Event;
}

function checkoutCompleted(paymentIntent: string, amount = 500) {
  return event("checkout.session.completed", {
    object: "checkout.session",
    payment_intent: paymentIntent,
    amount_total: amount,
    payment_status: "paid",
    metadata: { venueId: VENUE, workerId: WORKER, message: "Great coffee" }
  });
}

async function eventsFor(db: any, paymentIntent: string) {
  const result = await db.from("recognition_events").select("*").eq("stripe_payment_intent_id", paymentIntent);
  return result.data as any[];
}

describe("handleStripeEvent", () => {
  beforeEach(freshDemoData);

  it("creates a recognition from a completed checkout", async () => {
    const createRecognition = vi.fn(async () => ({}));
    const outcome = await handleStripeEvent(checkoutCompleted("pi_new_1", 1000), { db: createDemoClient({ env: {} }), createRecognition });
    expect(outcome.action).toBe("recognition_created");
    expect(createRecognition).toHaveBeenCalledWith(
      expect.objectContaining({ venueId: VENUE, workerId: WORKER, amountPence: 1000, stripePaymentIntentId: "pi_new_1", stripeStatus: "paid" })
    );
  });

  it("ignores a checkout without GratiFi metadata", async () => {
    const createRecognition = vi.fn();
    const outcome = await handleStripeEvent(
      event("checkout.session.completed", { payment_intent: "pi_x", amount_total: 500, metadata: {} }),
      { db: createDemoClient({ env: {} }), createRecognition }
    );
    expect(outcome.action).toBe("ignored");
    expect(createRecognition).not.toHaveBeenCalled();
  });

  it("marks full and partial refunds", async () => {
    const db = createDemoClient({ env: {} });
    const deps = { db, createRecognition: vi.fn() };
    await handleStripeEvent(event("charge.refunded", { payment_intent: "pi_demo_0002", amount: 500, amount_refunded: 200 }), deps);
    expect((await eventsFor(db, "pi_demo_0002"))[0].stripe_status).toBe("partially_refunded");
    await handleStripeEvent(event("charge.refunded", { payment_intent: "pi_demo_0002", amount: 500, amount_refunded: 500 }), deps);
    expect((await eventsFor(db, "pi_demo_0002"))[0].stripe_status).toBe("refunded");
  });

  it("tracks a dispute from opening to outcome", async () => {
    const db = createDemoClient({ env: {} });
    const deps = { db, createRecognition: vi.fn() };
    await handleStripeEvent(event("charge.dispute.created", { payment_intent: "pi_demo_0003" }), deps);
    expect((await eventsFor(db, "pi_demo_0003"))[0].stripe_status).toBe("disputed");
    await handleStripeEvent(event("charge.dispute.closed", { payment_intent: "pi_demo_0003", status: "lost" }), deps);
    expect((await eventsFor(db, "pi_demo_0003"))[0].stripe_status).toBe("dispute_lost");
  });

  it("ignores refunds for payments it doesn't know and unrelated events", async () => {
    const deps = { db: createDemoClient({ env: {} }), createRecognition: vi.fn() };
    expect((await handleStripeEvent(event("charge.refunded", { payment_intent: "pi_unknown", amount: 1, amount_refunded: 1 }), deps)).action).toBe("ignored");
    expect((await handleStripeEvent(event("customer.created", {}), deps)).action).toBe("ignored");
  });
});

describe("POST /api/stripe/webhook", () => {
  const stripe = new Stripe("sk_test_dummy");
  const original = { ...process.env };

  beforeEach(() => {
    freshDemoData();
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    process.env.GRATIFI_DEMO_MODE = "true"; // records go to the in-memory demo store
    delete process.env.UPSTASH_REDIS_REST_URL;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  function signedRequest(payload: string, secret = SECRET) {
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
    return new Request("http://localhost/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body: payload });
  }

  it("rejects a request with no signature", async () => {
    const response = await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
  });

  it("rejects a request signed with the wrong secret", async () => {
    const payload = JSON.stringify(checkoutCompleted("pi_forged"));
    const response = await POST(signedRequest(payload, "whsec_wrong"));
    expect(response.status).toBe(400);
  });

  it("records a signed payment once, even when Stripe delivers it twice", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const payload = JSON.stringify(checkoutCompleted("pi_signed_1", 700));
    const first = await POST(signedRequest(payload));
    const second = await POST(signedRequest(payload));
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const rows = await eventsFor(createDemoClient({ env: {} }), "pi_signed_1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ amount_pence: 700, stripe_status: "paid" });
  });
});
