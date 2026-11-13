import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";

/**
 * Payroll and tronc export: what each staff member received in tips over a period.
 * Refunded and disputed tips are shown separately and taken out of the net figure.
 */
export interface PayrollRow {
  worker_id: string;
  staff_name: string;
  role: string;
  tips: number;
  gross_pence: number;
  reversed_pence: number;
  net_pence: number;
}

export interface Period {
  from: string; // YYYY-MM-DD, inclusive
  to: string; // YYYY-MM-DD, inclusive
}

export function inPeriod(createdAt: string, period: Period) {
  const day = createdAt.slice(0, 10);
  return day >= period.from && day <= period.to;
}

/** The previous calendar month, the usual payroll period. */
export function lastMonth(now = new Date()): Period {
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) };
}

export function isValidPeriod(period: Partial<Period>): period is Period {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  return Boolean(period.from && period.to && iso.test(period.from) && iso.test(period.to) && period.from <= period.to);
}

export function payrollRows(events: any[], workers: any[], period: Period): PayrollRow[] {
  const byWorker = new Map<string, PayrollRow>();
  for (const worker of workers) {
    byWorker.set(worker.id, {
      worker_id: worker.id,
      staff_name: worker.display_name,
      role: worker.role,
      tips: 0,
      gross_pence: 0,
      reversed_pence: 0,
      net_pence: 0
    });
  }
  for (const event of events) {
    if (!inPeriod(event.created_at, period)) continue;
    const row = byWorker.get(event.worker_id);
    if (!row) continue;
    const amount = Number(event.amount_pence ?? 0);
    row.tips += 1;
    row.gross_pence += amount;
    if (REVERSED_STRIPE_STATUSES.includes(String(event.stripe_status))) row.reversed_pence += amount;
    row.net_pence = row.gross_pence - row.reversed_pence;
  }
  return [...byWorker.values()].sort((a, b) => b.net_pence - a.net_pence || a.staff_name.localeCompare(b.staff_name));
}

const pounds = (pence: number) => (pence / 100).toFixed(2);

function csvCell(value: string | number) {
  const text = String(value);
  // Quote everything and neutralise spreadsheet formulas (=, +, -, @) in names typed by venues.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function payrollCsv(rows: PayrollRow[], period: Period, venueName: string) {
  const header = ["venue", "period_from", "period_to", "staff_name", "role", "tips", "gross_gbp", "refunded_or_disputed_gbp", "net_gbp"];
  const lines = rows.map((row) =>
    [venueName, period.from, period.to, row.staff_name, row.role, row.tips, pounds(row.gross_pence), pounds(row.reversed_pence), pounds(row.net_pence)]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...lines].join("\n");
}
