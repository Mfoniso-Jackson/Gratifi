import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";
import { coverFeePence, tipFromSession } from "@/lib/payments/fees";
import { PaymentService } from "@/lib/services/PaymentService";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";
import { createDemoClient } from "@/lib/demo/client";

const VENUE = "de30a001-0000-4000-8000-000000000001";
const WORKER = "de30b002-0000-4000-8000-000000000001";

describe("covering the card fee", () => {
  it("adds enough that the tip arrives in full after 1.5% + 20p", () => {
    expect(coverFeePence(300)).toBe(25);
    expect(coverFeePence(500)).toBe(28);
    expect(coverFeePence(1000)).toBe(36);
    for (const tip of [200, 300, 500, 1000, 2000, 50000]) {
      const gross = tip + coverFeePence(tip);
      expect(gross - (gross * 0.015 + 20)).toBeGreaterThanOrEqual(tip);
    }
    expect(coverFeePence(0)).toBe(0);
  });

  it("reads the tip from metadata, falling back to the total for older sessions", () => {
    expect(tipFromSession({ amount_total: 528, metadata: { tipPence: "500" } })).toBe(500);
    expect(tipFromSession({ amount_total: 500, metadata: {} })).toBe(500);
    // A tip larger than what was paid is never trusted.
    expect(tipFromSession({ amount_total: 500, metadata: { tipPence: "900" } })).toBe(500);
  });

  it("puts the fee on its own checkout line and records the tip amount in metadata", async () => {
    const create = vi.fn(async (params: any) => ({ url: "https://checkout.stripe.test", ...params }));
    const service = new PaymentService({ checkout: { sessions: { create } } } as unknown as Stripe);
    await service.createCheckoutSession({ workerId: WORKER, venueId: VENUE, amountPence: 500, coverFee: true });
    const params = create.mock.calls[0][0];
    expect(params.line_items.map((item: any) => item.price_data.unit_amount)).toEqual([500, 28]);
    expect(params.metadata).toMatchObject({ tipPence: "500", coverFeePence: "28" });

    await service.createCheckoutSession({ workerId: WORKER, venueId: VENUE, amountPence: 500 });
    expect(create.mock.calls[1][0].line_items).toHaveLength(1);
  });

  it("refuses tips under the £2 minimum", async () => {
    const service = new PaymentService({ checkout: { sessions: { create: vi.fn() } } } as unknown as Stripe);
    await expect(service.createCheckoutSession({ workerId: WORKER, venueId: VENUE, amountPence: 100 })).rejects.toThrow(/outside/);
  });

  it("records only the tip when the customer covered the fee", async () => {
    const createRecognition = vi.fn(async () => ({ id: null }));
    const applyDreamTip = vi.fn(async () => ({}));
    const event = {
      id: "evt_fee",
      type: "checkout.session.completed",
      data: { object: { mode: "payment", payment_intent: "pi_fee", amount_total: 528, payment_status: "paid", metadata: { venueId: VENUE, workerId: WORKER, tipPence: "500", coverFeePence: "28", dreamLinked: "true" } } }
    } as unknown as Stripe.Event;
    await handleStripeEvent(event, { db: createDemoClient({ env: {} }), createRecognition, applyDreamTip });
    expect(createRecognition).toHaveBeenCalledWith(expect.objectContaining({ amountPence: 500 }));
    expect(applyDreamTip).toHaveBeenCalledWith(expect.objectContaining({ amountPence: 500 }));
  });
});
