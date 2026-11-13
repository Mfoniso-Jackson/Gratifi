/**
 * Venue plans (see the Monetisation Playbook). Prices are in pence and are starting points to test.
 * Stripe prices are created inline at checkout, so no product setup is needed in the Stripe dashboard.
 */
export type PlanId = "starter" | "pro" | "group";
export type BillingInterval = "month" | "year";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPence: number;
  summary: string;
  features: string[];
  includesPayroll: boolean;
  selfServe: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPence: 2900,
    summary: "One venue, up to 10 staff",
    features: ["Venue and staff QR codes", "Dashboard and thank-you notes", "CSV export of tips"],
    includesPayroll: false,
    selfServe: true
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPence: 7900,
    summary: "Busy single venues",
    features: ["Everything in Starter", "Payroll and tronc export", "Per-staff insights", "Printed QR kit"],
    includesPayroll: true,
    selfServe: true
  },
  group: {
    id: "group",
    name: "Group",
    monthlyPence: 5900,
    summary: "Per venue, for groups of 10 or more",
    features: ["Everything in Pro", "Multi-venue reporting", "Account manager"],
    includesPayroll: true,
    selfServe: false
  }
};

export const PILOT_DAYS = 30;
/** Annual plans pay for 10 months and get 12. */
export const ANNUAL_MONTHS_CHARGED = 10;
export const PAYROLL_ADDON_PENCE = 4000;

export function priceFor(plan: PlanId, interval: BillingInterval) {
  const monthly = PLANS[plan].monthlyPence;
  return interval === "year" ? monthly * ANNUAL_MONTHS_CHARGED : monthly;
}

export function formatPence(pence: number) {
  return `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`;
}

/** Days left in the free pilot, counted from when the venue was created. */
export function pilotDaysLeft(venueCreatedAt: string, now = new Date()) {
  const ends = Date.parse(venueCreatedAt) + PILOT_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((ends - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export interface SubscriptionRow {
  plan: PlanId;
  status: string;
  payroll_addon: boolean;
}

const LIVE_STATUSES = ["trialing", "active", "past_due"];

/**
 * Payroll export is part of Pro and Group, or a paid add-on on Starter. Venues still in their free
 * pilot (no subscription yet) get it too, so they can see its value before choosing a plan.
 */
export function canUsePayrollExport(subscription: SubscriptionRow | null, venueCreatedAt: string, now = new Date()) {
  if (!subscription) return pilotDaysLeft(venueCreatedAt, now) > 0;
  if (!LIVE_STATUSES.includes(subscription.status)) return false;
  return PLANS[subscription.plan]?.includesPayroll || subscription.payroll_addon;
}

/**
 * What happens when a pilot ends without a plan (the policy, in one place):
 *
 *   pilot   days 1-30: everything works.
 *   grace   the next GRACE_DAYS (default 7): everything works; owners see a countdown to choose a plan.
 *   paused  after that: the venue stops taking new tips. Its dashboard, tip history, payroll export and
 *           billing page keep working, so the owner can still see and download everything and restart
 *           instantly by choosing a plan.
 *   paid    a live subscription (trialing, active, or past_due while Stripe retries the card),
 *           or a venue GratiFi has marked billing_exempt.
 *
 * A cancelled or unpaid subscription pauses the venue straight away (Stripe only cancels at the end
 * of the paid period, or after its retries fail).
 */
export const GRACE_DAYS = Number(process.env.PILOT_GRACE_DAYS ?? 7);

export type VenueAccessState = "pilot" | "grace" | "paid" | "paused";

export interface VenueAccess {
  state: VenueAccessState;
  /** Days left in the current pilot or grace period (0 otherwise). */
  daysLeft: number;
  takingTips: boolean;
}

export function venueAccess(
  venue: { created_at: string; billing_exempt?: boolean | null },
  subscription: { status: string } | null,
  now = new Date(),
  graceDays = GRACE_DAYS
): VenueAccess {
  if (venue.billing_exempt) return { state: "paid", daysLeft: 0, takingTips: true };
  if (subscription) {
    return LIVE_STATUSES.includes(subscription.status)
      ? { state: "paid", daysLeft: 0, takingTips: true }
      : { state: "paused", daysLeft: 0, takingTips: false };
  }
  const pilotLeft = pilotDaysLeft(venue.created_at, now);
  if (pilotLeft > 0) return { state: "pilot", daysLeft: pilotLeft, takingTips: true };
  const graceEnds = Date.parse(venue.created_at) + (PILOT_DAYS + graceDays) * 24 * 60 * 60 * 1000;
  const graceLeft = Math.max(0, Math.ceil((graceEnds - now.getTime()) / (24 * 60 * 60 * 1000)));
  if (graceLeft > 0) return { state: "grace", daysLeft: graceLeft, takingTips: true };
  return { state: "paused", daysLeft: 0, takingTips: false };
}
