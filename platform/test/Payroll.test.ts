import { describe, expect, it } from "vitest";
import { lastMonth, payrollCsv, payrollRows, isValidPeriod } from "@/lib/services/PayrollService";
import { canUsePayrollExport, pilotDaysLeft, priceFor } from "@/lib/billing/plans";

const workers = [
  { id: "w1", display_name: "Maya", role: "Barista" },
  { id: "w2", display_name: "=SUM(A1)", role: "Kitchen" }
];
const events = [
  { worker_id: "w1", amount_pence: 500, stripe_status: "paid", created_at: "2026-10-03T10:00:00Z" },
  { worker_id: "w1", amount_pence: 1000, stripe_status: "refunded", created_at: "2026-10-04T10:00:00Z" },
  { worker_id: "w1", amount_pence: 300, stripe_status: "paid", created_at: "2026-11-01T10:00:00Z" },
  { worker_id: "w2", amount_pence: 200, stripe_status: "paid", created_at: "2026-10-31T23:00:00Z" }
];
const october = { from: "2026-10-01", to: "2026-10-31" };

describe("payroll export", () => {
  it("totals each staff member's tips in the period, net of refunds", () => {
    const rows = payrollRows(events, workers, october);
    expect(rows.map((r) => r.staff_name)).toEqual(["Maya", "=SUM(A1)"]);
    expect(rows.find((r) => r.worker_id === "w2")).toMatchObject({ tips: 1, net_pence: 200 });
    expect(rows.find((r) => r.worker_id === "w1")).toMatchObject({ tips: 2, gross_pence: 1500, reversed_pence: 1000, net_pence: 500 });
  });

  it("writes a CSV that spreadsheets can't run as a formula", () => {
    const csv = payrollCsv(payrollRows(events, workers, october), october, "Juniper & Oak");
    expect(csv.split("\n").at(0)).toContain("net_gbp");
    expect(csv).toContain(`"'=SUM(A1)"`);
    expect(csv).toContain(`"5.00"`);
  });

  it("defaults to last calendar month and checks periods", () => {
    expect(lastMonth(new Date("2026-11-13T12:00:00Z"))).toEqual(october);
    expect(isValidPeriod({ from: "2026-10-31", to: "2026-10-01" })).toBe(false);
    expect(isValidPeriod({ from: "2026-10-01", to: "2026-10-31" })).toBe(true);
  });
});

describe("plans", () => {
  const now = new Date("2026-11-13T00:00:00Z");
  it("prices annual plans at ten months", () => {
    expect(priceFor("pro", "month")).toBe(7900);
    expect(priceFor("pro", "year")).toBe(79000);
  });

  it("counts down the 30-day pilot", () => {
    expect(pilotDaysLeft("2026-11-03T00:00:00Z", now)).toBe(20);
    expect(pilotDaysLeft("2026-09-01T00:00:00Z", now)).toBe(0);
  });

  it("allows payroll export on Pro, the add-on, or during the pilot", () => {
    const recent = "2026-11-10T00:00:00Z";
    const old = "2026-01-01T00:00:00Z";
    expect(canUsePayrollExport(null, recent, now)).toBe(true);
    expect(canUsePayrollExport(null, old, now)).toBe(false);
    expect(canUsePayrollExport({ plan: "starter", status: "active", payroll_addon: false }, old, now)).toBe(false);
    expect(canUsePayrollExport({ plan: "starter", status: "active", payroll_addon: true }, old, now)).toBe(true);
    expect(canUsePayrollExport({ plan: "pro", status: "trialing", payroll_addon: false }, old, now)).toBe(true);
    expect(canUsePayrollExport({ plan: "pro", status: "canceled", payroll_addon: false }, old, now)).toBe(false);
  });
});
