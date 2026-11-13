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
