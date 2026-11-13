import { describe, expect, it } from "vitest";
import { staffSummary } from "@/lib/services/StaffService";

describe("staff view", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  const events = [
    { amount_pence: 500, stripe_status: "paid", message: "Lovely", created_at: "2026-11-02T10:00:00Z" },
    { amount_pence: 1000, stripe_status: "refunded", message: "Oops", created_at: "2026-11-05T10:00:00Z" },
    { amount_pence: 300, stripe_status: "paid", message: null, created_at: "2026-10-20T10:00:00Z" }
  ];

  it("totals this month and all time, leaving out refunded tips", () => {
    expect(staffSummary(events, now)).toEqual({ thisMonthPence: 500, allTimePence: 800, thankYous: 2, notes: 2 });
  });

  it("handles a new staff member with no tips", () => {
    expect(staffSummary([], now)).toEqual({ thisMonthPence: 0, allTimePence: 0, thankYous: 0, notes: 0 });
  });
});
