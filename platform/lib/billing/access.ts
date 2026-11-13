import { canUsePayrollExport, type SubscriptionRow } from "@/lib/billing/plans";

/** Whether a venue may use the payroll export right now (admins always may). */
export async function venueCanUsePayroll(db: any, venue: { id: string; created_at: string }, isAdmin: boolean) {
  if (isAdmin) return true;
  const subscription = await db.from("venue_subscriptions").select("*").eq("venue_id", venue.id).maybeSingle();
  return canUsePayrollExport((subscription.data as SubscriptionRow | null) ?? null, venue.created_at);
}
