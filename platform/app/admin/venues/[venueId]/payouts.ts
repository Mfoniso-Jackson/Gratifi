"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { appConfig } from "@/lib/config";
import { isDemoMode } from "@/lib/demo/mode";
import { canAccessVenue, requireAdmin } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/PaymentService";
import { dashboardLink, startOnboarding } from "@/lib/payouts/ConnectService";

async function venueYouManage(venueId: string) {
  const context = await requireAdmin();
  if (!canAccessVenue(context, venueId)) throw new Error("Venue not found.");
  const db = createServiceClient();
  const venue = (await db.from("venues").select("*").eq("id", venueId).maybeSingle()).data;
  if (!venue) throw new Error("Venue not found.");
  return { db, venue };
}

/** Sends the owner to Stripe to set up (or finish setting up) where tips are paid. */
export async function setUpPayouts(formData: FormData) {
  const { db, venue } = await venueYouManage(String(formData.get("venueId")));
  const page = `/admin/venues/${venue.id}`;

  if (isDemoMode()) {
    // No Stripe in demo mode: mark the venue as connected, as if onboarding had finished.
    await db
      .from("venues")
      .update({
        stripe_account_id: venue.stripe_account_id ?? `acct_demo_${venue.slug}`,
        stripe_charges_enabled: true,
        stripe_payouts_enabled: true,
        stripe_details_submitted: true,
        stripe_account_updated_at: new Date().toISOString()
      })
      .eq("id", venue.id);
    revalidatePath(page);
    redirect(`${page}?payouts=done`);
  }

  const url = await startOnboarding(new PaymentService().api(), db, venue, {
    returnUrl: `${appConfig.appUrl}${page}?payouts=returned`,
    refreshUrl: `${appConfig.appUrl}${page}?payouts=retry`
  });
  redirect(url);
}

/** Opens the venue's Stripe Express dashboard: balances, payouts and bank details. */
export async function openStripeDashboard(formData: FormData) {
  const { venue } = await venueYouManage(String(formData.get("venueId")));
  if (!venue.stripe_account_id) throw new Error("Set up payouts first.");
  if (isDemoMode()) redirect(`/admin/venues/${venue.id}?payouts=demo-dashboard`);
  redirect(await dashboardLink(new PaymentService().api(), venue.stripe_account_id));
}
