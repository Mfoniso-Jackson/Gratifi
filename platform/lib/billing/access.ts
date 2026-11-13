import { canUsePayrollExport, venueAccess as computeVenueAccess, type SubscriptionRow, type VenueAccess } from "@/lib/billing/plans";

/** Whether a venue may use the payroll export right now (admins always may). */
export async function venueCanUsePayroll(db: any, venue: { id: string; created_at: string }, isAdmin: boolean) {
  if (isAdmin) return true;
  const subscription = await db.from("venue_subscriptions").select("*").eq("venue_id", venue.id).maybeSingle();
  return canUsePayrollExport((subscription.data as SubscriptionRow | null) ?? null, venue.created_at);
}

/** Loads a venue's subscription and works out whether it is taking tips (see venueAccess in plans.ts). */
export async function loadVenueAccess(
  db: any,
  venue: { id: string; created_at: string; billing_exempt?: boolean | null }
): Promise<VenueAccess> {
  const subscription = await db.from("venue_subscriptions").select("status").eq("venue_id", venue.id).maybeSingle();
  return computeVenueAccess(venue, subscription.data ?? null);
}
