import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { dueDate, eraseStaff, eraseTipNotes, exportStaffData, matchCustomerTips, readDataRequest } from "@/lib/services/DataRequestService";

const MAYA = "de30b002-0000-4000-8000-000000000001";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

describe("data requests", () => {
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
  });

  it("validates requests, and asks customers where they tipped", () => {
    const ok = readDataRequest(form({ requesterType: "customer", requestType: "delete", email: "A@B.co", venueName: "Juniper", amount: "£5" }));
    expect(ok.errors).toEqual({});
    expect(ok.input).toMatchObject({ email: "a@b.co", amountPence: 500 });
    const bad = readDataRequest(form({ requesterType: "customer", requestType: "correct", email: "nope" }));
    expect(Object.keys(bad.errors).sort()).toEqual(["details", "email", "venueName"]);
  });

  it("sets the reply deadline one calendar month out", () => {
    expect(dueDate(new Date("2026-11-13T09:00:00Z"))).toBe("2026-12-13");
    expect(dueDate(new Date("2027-01-31T09:00:00Z"))).toBe("2027-02-28");
  });

  it("finds a customer's tip from venue, date and amount", async () => {
    const db = createDemoClient({ env: {} });
    const events = (await db.from("recognition_events").select("*, venues(name)")).data;
    const request = (await db.from("data_requests").select("*").eq("reference", "DR-4F2A9C1E").single()).data;
    const matches = matchCustomerTips(events, request);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.every((e: any) => e.amount_pence === request.amount_pence)).toBe(true);
  });

  it("removes a tip's note but keeps the amount and payment reference", async () => {
    const db = createDemoClient({ env: {} });
    const tip = (await db.from("recognition_events").select("*").eq("stripe_payment_intent_id", "pi_demo_0001").single()).data;
    await eraseTipNotes(db, [tip.id]);
    const after = (await db.from("recognition_events").select("*").eq("id", tip.id).single()).data;
    expect(after.message).toBeNull();
    expect(after).toMatchObject({ amount_pence: tip.amount_pence, stripe_payment_intent_id: "pi_demo_0001" });
  });

  it("exports then erases a staff member, deleting their sign-in", async () => {
    const db = createDemoClient({ env: {} });
    const copy = await exportStaffData(db, [MAYA]);
    expect(copy.staff_records.at(0)).toMatchObject({ display_name: "Maya" });
    expect(copy.tips.length).toBeGreaterThan(0);

    const deleteUser = vi.fn(async () => {});
    await eraseStaff(db, [MAYA], deleteUser);
    expect(deleteUser).toHaveBeenCalled();
    const worker = (await db.from("workers").select("*").eq("id", MAYA).single()).data;
    expect(worker).toMatchObject({ display_name: "Former staff member", photo_url: null, user_id: null, status: "inactive" });
    const tips = (await db.from("recognition_events").select("*").eq("worker_id", MAYA)).data;
    expect(tips.every((t: any) => t.message === null && t.amount_pence > 0)).toBe(true);
    const dreams = (await db.from("worker_dreams").select("*").eq("worker_id", MAYA)).data;
    expect(dreams.every((d: any) => d.status === "withdrawn" && d.story === null)).toBe(true);
  });
});
