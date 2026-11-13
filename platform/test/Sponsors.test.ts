import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { applyDreamTip, getDream } from "@/lib/dreams/DreamService";
import { campaignReport, checkLogo, reportCsv } from "@/lib/sponsors/SponsorService";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";
import { sponsorsEnabled } from "@/lib/features";

const MAYA = "de30b002-0000-4000-8000-000000000001";
const CAMPAIGN = "de30f008-0000-4000-8000-000000000001";
const CAFE = "de30a001-0000-4000-8000-000000000001";

describe("sponsors and the Dream Fund", () => {
  const original = { ...process.env };
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
    process.env.GRATIFI_DEMO_MODE = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("stays switched off outside demo mode unless the flag is set", async () => {
    expect(sponsorsEnabled({})).toBe(false);
    expect(sponsorsEnabled({ GRATIFI_SPONSORS_ENABLED: "true" })).toBe(true);
    process.env.GRATIFI_DEMO_MODE = "false";
    expect(await getDream(createDemoClient({ env: {} }), MAYA)).toBeNull();
  });

  it("shows a sponsored dream with the sponsor's name and fund", async () => {
    const dream = await getDream(createDemoClient({ env: {} }), MAYA);
    expect(dream).toMatchObject({ title: "Level 2 barista course", sponsor_name: "Your Brand Here", mode: "match", fund_left_pence: 151500 });
  });

  it("hides the sponsor where the venue has blocked it", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("campaign_venues").update({ blocked: true }).eq("venue_id", CAFE);
    const dream = await getDream(db, MAYA);
    expect(dream?.sponsor_name).toBeNull();
    expect(dream?.title).toBe("Level 2 barista course");
  });

  it("matches a tip from the fund, records it, and never counts the same tip twice", async () => {
    const db = createDemoClient({ env: {} });
    const first = await applyDreamTip(db, { workerId: MAYA, amountPence: 1000, recognitionId: "rec-1" });
    expect(first).toEqual({ fromTip: 1000, match: 1000, before: 31500 });
    expect(await applyDreamTip(db, { workerId: MAYA, amountPence: 1000, recognitionId: "rec-1" })).toBeNull();

    const dream = (await db.from("worker_dreams").select("*").eq("worker_id", MAYA).single()).data;
    expect(dream.funded_pence).toBe(33500);
    const campaign = (await db.from("sponsor_campaigns").select("*").eq("id", CAMPAIGN).single()).data;
    expect(campaign.fund_spent_pence).toBe(49500);
  });

  it("stops matching when the sponsor's fund runs out", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("sponsor_campaigns").update({ fund_spent_pence: 199700 }).eq("id", CAMPAIGN);
    const result = await applyDreamTip(db, { workerId: MAYA, amountPence: 1000, recognitionId: "rec-2" });
    expect(result).toMatchObject({ fromTip: 1000, match: 300 });
  });

  it("builds the brand report from counts", async () => {
    const db = createDemoClient({ env: {} });
    const campaign = (await db.from("sponsor_campaigns").select("*").eq("id", CAMPAIGN).single()).data;
    const report = await campaignReport(db, campaign);
    expect(report).toMatchObject({ venues: 2, views: 40, dreams: 2, staff_reached: 2, brand_matched_pence: 48500, fund_left_pence: 151500 });
    expect(reportCsv("Your Brand Here", [report]).split("\n")).toHaveLength(2);
  });

  it("accepts only small PNG, JPEG or WebP logos", () => {
    expect(checkLogo({ type: "image/png", size: 1000 })).toBeNull();
    expect(checkLogo({ type: "image/svg+xml", size: 1000 })).toMatch(/PNG/);
    expect(checkLogo({ type: "image/png", size: 600 * 1024 })).toMatch(/500 KB/);
  });

  it("applies a dream-linked live tip from the Stripe webhook", async () => {
    const applyDreamTipSpy = vi.fn(async () => null);
    const event = {
      id: "evt",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { mode: "payment", payment_intent: "pi_dream", amount_total: 500, payment_status: "paid", metadata: { venueId: CAFE, workerId: MAYA, dreamLinked: "true" } } }
    } as unknown as Stripe.Event;
    await handleStripeEvent(event, { db: createDemoClient({ env: {} }), createRecognition: async () => ({ id: "rec-9" }), applyDreamTip: applyDreamTipSpy });
    expect(applyDreamTipSpy).toHaveBeenCalledWith({ workerId: MAYA, amountPence: 500, recognitionId: "rec-9" });
  });
});
