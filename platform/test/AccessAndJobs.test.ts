import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { canAccessVenue, loadAccess, scopeToVenues, type AdminContext } from "@/lib/auth/access";
import { countBySource, isQrVisit, recordScan, scanToTipRate, visitSource } from "@/lib/services/ScanService";
import { QRService } from "@/lib/services/QRService";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { GET as retryJob } from "@/app/api/cron/retry-anchoring/route";

const CAFE = "de30a001-0000-4000-8000-000000000001";
const BARBER = "de30a001-0000-4000-8000-000000000002";

function freshDemoData() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

describe("admin access", () => {
  beforeEach(freshDemoData);

  async function withAccess(rows: { admin_users?: object[]; venue_members?: object[] }) {
    const db = createDemoClient({ env: {} });
    for (const row of rows.admin_users ?? []) await db.from("admin_users").insert(row);
    for (const row of rows.venue_members ?? []) await db.from("venue_members").insert(row);
    return db;
  }

  it("gives no access to a signed-in account without a role", async () => {
    const db = await withAccess({});
    expect(await loadAccess(db, "stranger")).toBeNull();
  });

  it("gives admins every venue", async () => {
    const db = await withAccess({ admin_users: [{ user_id: "boss", role: "admin" }] });
    expect(await loadAccess(db, "boss")).toEqual({ userId: "boss", role: "admin", venueIds: null });
  });

  it("limits a venue owner to their own venues", async () => {
    const db = await withAccess({
      admin_users: [{ user_id: "owner", role: "venue_owner" }],
      venue_members: [{ user_id: "owner", venue_id: CAFE }]
    });
    const context = (await loadAccess(db, "owner")) as AdminContext;
    expect(context.venueIds).toEqual([CAFE]);
    expect(canAccessVenue(context, CAFE)).toBe(true);
    expect(canAccessVenue(context, BARBER)).toBe(false);

    const tips = await scopeToVenues(db.from("recognition_events").select("*"), context);
    expect(tips.data.length).toBeGreaterThan(0);
    expect(tips.data.every((row: { venue_id: string }) => row.venue_id === CAFE)).toBe(true);
  });

  it("shows an owner with no venues nothing", async () => {
    const db = createDemoClient({ env: {} });
    const context: AdminContext = { userId: "owner", role: "venue_owner", venueIds: [] };
    const tips = await scopeToVenues(db.from("recognition_events").select("*"), context);
    expect(tips.data).toHaveLength(0);
  });
});

describe("QR scans", () => {
  beforeEach(freshDemoData);

  it("tags QR links and recognises QR visits", () => {
    expect(new QRService().venueUrl("demo-cafe")).toMatch(/\/v\/demo-cafe\?src=qr$/);
    expect(isQrVisit({ src: "qr" })).toBe(true);
    expect(isQrVisit({})).toBe(false);
  });

  it("tags NFC links and tells taps from scans", async () => {
    expect(new QRService().workerUrl("abc", "nfc")).toMatch(/\/tip\/abc\?src=nfc$/);
    expect(visitSource({ src: "nfc" })).toBe("nfc");
    expect(visitSource({ src: "qr" })).toBe("qr");
    expect(visitSource({ src: "email" })).toBeNull();

    const db = createDemoClient({ env: {} });
    const before = countBySource((await db.from("qr_scans").select("*")).data);
    await recordScan(db, { venueId: CAFE, source: "nfc" });
    await recordScan(db, { venueId: CAFE });
    const after = countBySource((await db.from("qr_scans").select("*")).data);
    expect(after.nfc).toBe(before.nfc + 1);
    expect(after.qr).toBe(before.qr + 1);
    expect(countBySource([{ source: null }, { source: "nfc" }])).toEqual({ qr: 1, nfc: 1, total: 2 });
  });

  it("records a scan and never throws when it fails", async () => {
    const db = createDemoClient({ env: {} });
    const before = (await db.from("qr_scans").select("*")).data.length;
    await recordScan(db, { venueId: CAFE });
    expect((await db.from("qr_scans").select("*")).data.length).toBe(before + 1);

    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { from: () => ({ insert: async () => { throw new Error("down"); } }) };
    await expect(recordScan(broken, { venueId: CAFE })).resolves.toBeUndefined();
  });

  it("works out the scan-to-tip rate", () => {
    expect(scanToTipRate(0, 3)).toBeNull();
    expect(scanToTipRate(60, 20)).toBe(33);
    expect(scanToTipRate(5, 9)).toBe(100);
  });
});

describe("automatic anchoring retries", () => {
  const original = { ...process.env };
  beforeEach(() => {
    freshDemoData();
    process.env.GRATIFI_DEMO_MODE = "true";
    delete process.env.UPSTASH_REDIS_REST_URL;
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("refuses to run without CRON_SECRET, or with the wrong one", async () => {
    delete process.env.CRON_SECRET;
    expect((await retryJob(new Request("http://localhost/api/cron/retry-anchoring"))).status).toBe(503);
    process.env.CRON_SECRET = "right";
    const wrong = new Request("http://localhost/api/cron/retry-anchoring", { headers: { authorization: "Bearer wrong" } });
    expect((await retryJob(wrong)).status).toBe(401);
  });

  it("retries failed and stale pending recognitions", async () => {
    process.env.CRON_SECRET = "right";
    const request = new Request("http://localhost/api/cron/retry-anchoring", { headers: { authorization: "Bearer right" } });
    const response = await retryJob(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    // The chain isn't configured in tests, so attempts are made but stay failing.
    expect(body.attempted).toBeGreaterThanOrEqual(1);
    expect(body.confirmed).toBe(0);
  });

  it("leaves recently created pending recognitions alone", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("recognition_events").update({ anchor_status: "confirmed" }).eq("anchor_status", "retry");
    const recent = new Date().toISOString();
    await db.from("recognition_events").update({ created_at: recent }).eq("anchor_status", "pending");
    const result = await new RecognitionEngine(db).retryStuck({ staleMinutes: 10 });
    expect(result.attempted).toBe(0);
  });
});
