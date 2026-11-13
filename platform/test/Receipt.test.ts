import type Stripe from "stripe";
import { beforeEach, describe, expect, it } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { isCheckoutSessionId, loadReceipt } from "@/lib/services/ReceiptService";

const MAYA = "de30b002-0000-4000-8000-000000000001";
const CAFE = "de30a001-0000-4000-8000-000000000001";
const SESSION = "cs_test_a1b2c3d4e5f6g7h8i9";

function session(overrides: Partial<Stripe.Checkout.Session>) {
  return async () =>
    ({ id: SESSION, mode: "payment", payment_status: "paid", payment_intent: "pi_demo_0005", amount_total: 500, metadata: { workerId: MAYA, venueId: CAFE, message: "Ta!" }, ...overrides }) as Stripe.Checkout.Session;
}

describe("live thank-you page", () => {
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
  });

  it("only accepts Stripe Checkout session ids", () => {
    expect(isCheckoutSessionId(SESSION)).toBe(true);
    expect(isCheckoutSessionId("pi_123")).toBe(false);
    expect(isCheckoutSessionId("cs_test_../../x")).toBe(false);
  });

  it("shows the recorded tip once the webhook has landed", async () => {
    const receipt = await loadReceipt(createDemoClient({ env: {} }), SESSION, session({}));
    expect(receipt.state).toBe("recorded");
    if (receipt.state === "recorded") expect(receipt.event.recognition_hash).toMatch(/^0x/);
  });

  it("shows what was paid while the webhook is still on its way", async () => {
    const receipt = await loadReceipt(createDemoClient({ env: {} }), SESSION, session({ payment_intent: "pi_not_yet" }));
    expect(receipt).toMatchObject({ state: "recording", event: { amount_pence: 500, message: "Ta!", workers: { display_name: "Maya" } } });
  });

  it("says when payment didn't complete, and ignores other checkouts", async () => {
    expect((await loadReceipt(createDemoClient({ env: {} }), SESSION, session({ payment_status: "unpaid" }))).state).toBe("unpaid");
    expect((await loadReceipt(createDemoClient({ env: {} }), SESSION, session({ mode: "subscription" }))).state).toBe("invalid");
    expect((await loadReceipt(createDemoClient({ env: {} }), "nope", session({}))).state).toBe("invalid");
  });
});
