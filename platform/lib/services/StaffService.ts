import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";

/** What a staff member sees about their own tips. Refunded and disputed tips are listed but not counted. */
export interface StaffSummary {
  thisMonthPence: number;
  allTimePence: number;
  thankYous: number;
  notes: number;
}

export function isCounted(event: { stripe_status: string }) {
  return !REVERSED_STRIPE_STATUSES.includes(String(event.stripe_status));
}

export function staffSummary(events: any[], now = new Date()): StaffSummary {
  const month = now.toISOString().slice(0, 7);
  const counted = events.filter(isCounted);
  return {
    thisMonthPence: counted.filter((e) => String(e.created_at).startsWith(month)).reduce((s, e) => s + Number(e.amount_pence), 0),
    allTimePence: counted.reduce((s, e) => s + Number(e.amount_pence), 0),
    thankYous: counted.length,
    notes: events.filter((e) => e.message).length
  };
}
