import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { venueAccess } from "@/lib/billing/plans";
import { getDream, latestDreamRow, listWallDreams, readDreamProposal } from "@/lib/dreams/DreamService";
import { campaignReport } from "@/lib/sponsors/SponsorService";
import { POST as recognitions } from "@/app/api/v1/recognitions/route";

const CAFE = "de30a001-0000-4000-8000-000000000001";
const BARBER = "de30a001-0000-4000-8000-000000000002";
const MAYA = "de30b002-0000-4000-8000-000000000001";
const TOM = "de30b002-0000-4000-8000-000000000002";
const SPONSOR = "de30f007-0000-4000-8000-000000000001";
const CAMPAIGN = "de30f008-0000-4000-8000-000000000001";
const DAY = 24 * 60 * 60 * 1000;

describe("pilot-end policy", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  const created = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY).toISOString();

  it("runs pilot, then grace, then pauses", () => {
    expect(venueAccess({ created_at: created(10) }, null, now, 7)).toEqual({ state: "pilot", daysLeft: 20, takingTips: true });
    expect(venueAccess({ created_at: created(33) }, null, now, 7)).toEqual({ state: "grace", daysLeft: 4, takingTips: true });
    expect(venueAccess({ created_at: created(40) }, null, now, 7)).toEqual({ state: "paused", daysLeft: 0, takingTips: false });
  });

  it("keeps paying, exempt and retrying venues running, and pauses cancelled ones", () => {
    expect(venueAccess({ created_at: created(90) }, { status: "active" }, now).takingTips).toBe(true);
    expect(venueAccess({ created_at: created(90) }, { status: "past_due" }, now).takingTips).toBe(true);
    expect(venueAccess({ created_at: created(90), billing_exempt: true }, null, now).state).toBe("paid");
    expect(venueAccess({ created_at: created(5) }, { status: "canceled" }, now).state).toBe("paused");
  });
});

describe("with demo data", () => {
  const original = { ...process.env };
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
    process.env.GRATIFI_DEMO_MODE = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  const takingTips = async () => true;

  it("refuses new tips at a paused venue", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("venues").update({ created_at: new Date(Date.now() - 60 * DAY).toISOString() }).eq("id", CAFE);
    const form = new FormData();
    form.set("workerId", MAYA); form.set("venueId", CAFE); form.set("amountPence", "500");
    const response = await recognitions(new Request("http://localhost/api/v1/recognitions", { method: "POST", body: form }));
    expect(response.status).toBe(403);
  });

  it("checks staff dream proposals", () => {
    const form = (values: Record<string, string>) => {
      const data = new FormData();
      for (const [k, v] of Object.entries(values)) data.set(k, v);
      return data;
    };
    expect(readDreamProposal(form({ title: "Barista course", target: "£450", showOnWall: "on" }))).toEqual({
      proposal: { title: "Barista course", story: null, targetPence: 45000, showOnWall: true },
      errors: {}
    });
    expect(Object.keys(readDreamProposal(form({ title: "x", target: "9000" })).errors).sort()).toEqual(["target", "title"]);
  });

  it("keeps a pending dream off the tip page until a manager approves it", async () => {
    const db = createDemoClient({ env: {} });
    expect((await latestDreamRow(db, TOM))?.status).toBe("pending");
    expect(await getDream(db, TOM)).toBeNull();
    await db.from("worker_dreams").update({ status: "active" }).eq("worker_id", TOM);
    expect((await getDream(db, TOM))?.title).toMatch(/latte art/);
  });

  it("hides a sponsor a venue has blocked, and drops that venue from the brand report", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("venue_sponsor_blocks").insert({ venue_id: CAFE, sponsor_id: SPONSOR });
    expect((await getDream(db, MAYA))?.sponsor_name).toBeNull();
    const campaign = (await db.from("sponsor_campaigns").select("*").eq("id", CAMPAIGN).single()).data;
    expect((await campaignReport(db, campaign)).venues).toBe(1);
  });

  it("lists approved, opted-in dreams on the wall and leaves out paused venues", async () => {
    const db = createDemoClient({ env: {} });
    let wall = await listWallDreams(db, { isTakingTips: takingTips });
    expect(wall.map((item) => item.worker.display_name).sort()).toEqual(["Dev", "Maya"]); // Tom's is pending

    await db.from("worker_dreams").update({ show_on_wall: false }).eq("worker_id", MAYA);
    wall = await listWallDreams(db, { isTakingTips: takingTips });
    expect(wall.map((item) => item.worker.display_name)).toEqual(["Dev"]);

    wall = await listWallDreams(db, { isTakingTips: async (venue) => venue.id !== BARBER });
    expect(wall).toHaveLength(0);

    expect(await listWallDreams(db, { venueSlug: "sharp-and-co", isTakingTips: takingTips })).toHaveLength(1);
  });
});
