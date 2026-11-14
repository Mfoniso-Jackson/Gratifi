import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";

/** A small fake of the Stripe calls used, keeping transfer balances so double-reversals would show. */
function fakeStripe() {
  const transfer = { id: "tr_1", amount: 528, amount_reversed: 0, destination: "acct_venue" };
  const seen = new Map<string, unknown>();
  const once = <T>(key: string | undefined, make: () => T): T => {
    if (key && seen.has(key)) return seen.get(key) as T;
    const result = make();
    if (key) seen.set(key, result);
    return result;
  };
  const stripe = {
    transfers: {
      retrieve: vi.fn(async () => ({ ...transfer })),
      createReversal: vi.fn(async (_id: string, params: { amount: number }, opts?: { idempotencyKey?: string }) =>
        once(opts?.idempotencyKey, () => {
          transfer.amount_reversed += params.amount;
          return { id: `trr_${transfer.amount_reversed}` };
        })
      ),
      create: vi.fn(async (params: { amount: number }, opts?: { idempotencyKey?: string }) => once(opts?.idempotencyKey, () => ({ id: `tr_back_${params.amount}` })))
    },
    charges: { retrieve: vi.fn(async () => ({ id: "ch_1", transfer: "tr_1" })) }
  };
  return { stripe: stripe as unknown as Stripe, transfer, calls: stripe };
}

function event(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: `evt_${type}`, object: "event", type, data: { object } } as unknown as Stripe.Event;
}

const charge = (refunded: number, extra: Record<string, unknown> = {}) => ({ id: "ch_1", payment_intent: "pi_demo_0002", amount: 528, amount_refunded: refunded, transfer: "tr_1", ...extra });
const dispute = (status: string) => ({ id: "dp_1", charge: "ch_1", payment_intent: "pi_demo_0003", amount: 528, status });

describe("moving money back from venues", () => {
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
  });

  it("takes back a partial refund, then the rest, and never twice when Stripe resends", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, transfer } = fakeStripe();
    const deps = { db, createRecognition: vi.fn(), stripe };

    const partial = await handleStripeEvent(event("charge.refunded", charge(200)), deps);
    expect(partial).toMatchObject({ action: "status_updated", stripeStatus: "partially_refunded", adjustment: { kind: "refund_reversal", amountPence: 200 } });
    await handleStripeEvent(event("charge.refunded", charge(200)), deps); // resent
    expect(transfer.amount_reversed).toBe(200);

    await handleStripeEvent(event("charge.refunded", charge(528)), deps);
    expect(transfer.amount_reversed).toBe(528);
    const log = (await db.from("payment_adjustments").select("*").eq("stripe_ref", "ch_1")).data;
    expect(log.map((r: any) => r.amount_pence)).toEqual([200, 328]);
  });

  it("does nothing more when the refund was already reversed in the dashboard", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, transfer, calls } = fakeStripe();
    transfer.amount_reversed = 528;
    const outcome = await handleStripeEvent(event("charge.refunded", charge(528)), { db, createRecognition: vi.fn(), stripe });
    expect(outcome).not.toHaveProperty("adjustment");
    expect(calls.transfers.createReversal).not.toHaveBeenCalled();
  });

  it("ignores refunds of payments that didn't go to a venue", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, calls } = fakeStripe();
    await handleStripeEvent(event("charge.refunded", charge(528, { transfer: null })), { db, createRecognition: vi.fn(), stripe });
    expect(calls.transfers.createReversal).not.toHaveBeenCalled();
  });

  it("holds back a disputed tip, then pays it back to the venue if the dispute is won", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, transfer, calls } = fakeStripe();
    const deps = { db, createRecognition: vi.fn(), stripe };

    await handleStripeEvent(event("charge.dispute.created", dispute("needs_response")), deps);
    await handleStripeEvent(event("charge.dispute.created", dispute("needs_response")), deps); // resent
    expect(transfer.amount_reversed).toBe(528);

    const won = await handleStripeEvent(event("charge.dispute.closed", dispute("won")), deps);
    expect(won).toMatchObject({ stripeStatus: "dispute_won", adjustment: { kind: "dispute_return", amountPence: 528 } });
    await handleStripeEvent(event("charge.dispute.closed", dispute("won")), deps); // resent
    expect(calls.transfers.create).toHaveBeenCalledTimes(1);
    expect(calls.transfers.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 528, destination: "acct_venue" }), expect.anything());
  });

  it("keeps a lost dispute's money back from the venue", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, calls } = fakeStripe();
    const deps = { db, createRecognition: vi.fn(), stripe };
    await handleStripeEvent(event("charge.dispute.created", dispute("needs_response")), deps);
    const lost = await handleStripeEvent(event("charge.dispute.closed", dispute("lost")), deps);
    expect(lost).toMatchObject({ stripeStatus: "dispute_lost" });
    expect(calls.transfers.create).not.toHaveBeenCalled();
  });

  it("still updates statuses when Stripe isn't configured (demo mode)", async () => {
    const db = createDemoClient({ env: {} });
    const outcome = await handleStripeEvent(event("charge.refunded", charge(528)), { db, createRecognition: vi.fn() });
    expect(outcome).toMatchObject({ action: "status_updated", stripeStatus: "refunded" });
  });
});
