import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { cardFeePence, coverFeePence } from "@/lib/payments/fees";
import { applyAccountUpdate, canTakeCardTips, destinationCharge, payoutState, startOnboarding } from "@/lib/payouts/ConnectService";
import { PaymentService } from "@/lib/services/PaymentService";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";

const CAFE = "de30a001-0000-4000-8000-000000000001";
const BARBERS = "de30a001-0000-4000-8000-000000000002";
const WORKER = "de30b002-0000-4000-8000-000000000001";

function freshDemoData() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

describe("venue payouts (Stripe Connect)", () => {
  beforeEach(freshDemoData);

  it("works out where a venue is in setting up payouts", () => {
    expect(payoutState({ id: "v", name: "V" })).toBe("not_started");
    expect(payoutState({ id: "v", name: "V", stripe_account_id: "acct_1" })).toBe("incomplete");
    expect(payoutState({ id: "v", name: "V", stripe_account_id: "acct_1", stripe_details_submitted: true })).toBe("restricted");
    expect(payoutState({ id: "v", name: "V", stripe_account_id: "acct_1", stripe_charges_enabled: true, stripe_payouts_enabled: true })).toBe("ready");
  });

  it("only takes live card tips once the venue's account can accept payments", () => {
    expect(canTakeCardTips({ id: "v", name: "V" }, {})).toBe(false);
    expect(canTakeCardTips({ id: "v", name: "V", stripe_account_id: "acct_1", stripe_charges_enabled: true }, {})).toBe(true);
    expect(canTakeCardTips({ id: "v", name: "V" }, { REQUIRE_VENUE_PAYOUTS: "false" })).toBe(true);
  });

  it("pays the tip to the venue and keeps back only the card fee", () => {
    const charge = destinationCharge("acct_1", 500);
    expect(charge).toEqual({ on_behalf_of: "acct_1", transfer_data: { destination: "acct_1" }, application_fee_amount: cardFeePence(500) });
    // When the customer covers the fee, the venue receives at least the full tip.
    for (const tip of [200, 300, 500, 1000, 5000]) {
      const total = tip + coverFeePence(tip);
      expect(total - (destinationCharge("acct_1", total).application_fee_amount ?? 0)).toBeGreaterThanOrEqual(tip);
    }
  });

  it("sends checkout payments to the venue's account, and refuses venues without one", async () => {
    const create = vi.fn(async (params: any) => ({ url: "https://checkout.stripe.test", ...params }));
    const service = new PaymentService({ checkout: { sessions: { create } } } as unknown as Stripe);
    await service.createCheckoutSession({ workerId: WORKER, venueId: CAFE, amountPence: 500, coverFee: true, venueAccountId: "acct_venue" });
    expect(create.mock.calls[0][0].payment_intent_data).toEqual(destinationCharge("acct_venue", 528));
    await expect(service.createCheckoutSession({ workerId: WORKER, venueId: CAFE, amountPence: 500 })).rejects.toThrow(/set up payouts/);
  });

  it("creates the venue's Express account once and returns Stripe's onboarding link", async () => {
    const db = createDemoClient({ env: {} });
    const venue = (await db.from("venues").select("*").eq("id", BARBERS).single()).data;
    const stripe = {
      accounts: { create: vi.fn(async () => ({ id: "acct_new" })) },
      accountLinks: { create: vi.fn(async () => ({ url: "https://connect.stripe.test/onboard" })) }
    } as unknown as Stripe;
    const urls = { returnUrl: "https://app.test/back", refreshUrl: "https://app.test/again" };

    expect(await startOnboarding(stripe, db, venue, urls)).toBe("https://connect.stripe.test/onboard");
    expect(stripe.accounts.create).toHaveBeenCalledWith(expect.objectContaining({ type: "express", country: "GB", metadata: { venueId: BARBERS } }));
    const saved = (await db.from("venues").select("*").eq("id", BARBERS).single()).data;
    expect(saved.stripe_account_id).toBe("acct_new");

    // Coming back to finish: no second account.
    await startOnboarding(stripe, db, saved, urls);
    expect(stripe.accounts.create).toHaveBeenCalledTimes(1);
    expect(stripe.accountLinks.create).toHaveBeenLastCalledWith(expect.objectContaining({ account: "acct_new", type: "account_onboarding" }));
  });

  it("turns card tips on when Stripe says the account is ready", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("venues").update({ stripe_account_id: "acct_barbers" }).eq("id", BARBERS);
    const event = {
      id: "evt_acct",
      type: "account.updated",
      data: { object: { id: "acct_barbers", charges_enabled: true, payouts_enabled: true, details_submitted: true } }
    } as unknown as Stripe.Event;
    expect(await handleStripeEvent(event, { db, createRecognition: vi.fn() })).toEqual({ action: "venue_payouts_updated", accountId: "acct_barbers" });
    const venue = (await db.from("venues").select("*").eq("id", BARBERS).single()).data;
    expect(payoutState(venue)).toBe("ready");
    expect(await applyAccountUpdate(db, { id: "acct_unknown" } as Stripe.Account)).toBe(false);
  });
});
