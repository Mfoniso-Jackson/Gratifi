"use server";

import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { isDemoMode } from "@/lib/demo/mode";
import { canAccessVenue, requireAdmin } from "@/lib/auth/access";
import { checkoutParams, trialEndFor } from "@/lib/billing/BillingService";
import { PLANS, type BillingInterval, type PlanId } from "@/lib/billing/plans";
import { PaymentService } from "@/lib/services/PaymentService";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionClient } from "@/lib/supabase/session";

async function venueFor(venueId: string) {
  const context = await requireAdmin();
  if (!canAccessVenue(context, venueId)) throw new Error("Venue not found.");
  const db = createServiceClient();
  const venue = await db.from("venues").select("id, name, created_at").eq("id", venueId).single();
  if (venue.error || !venue.data) throw new Error("Venue not found.");
  const subscription = await db.from("venue_subscriptions").select("*").eq("venue_id", venueId).maybeSingle();
  return { db, venue: venue.data, subscription: subscription.data };
}

export async function choosePlan(formData: FormData) {
  const venueId = String(formData.get("venueId"));
  const plan = String(formData.get("plan")) as PlanId;
  const interval: BillingInterval = formData.get("interval") === "year" ? "year" : "month";
  const payrollAddon = formData.get("payrollAddon") === "on";
  if (!PLANS[plan]?.selfServe) throw new Error("Choose Starter or Pro.");
  const { db, venue, subscription } = await venueFor(venueId);

  if (isDemoMode()) {
    // No Stripe in demo mode: record the plan as if checkout had completed.
    const trialEnd = trialEndFor(venue.created_at);
    await db.from("venue_subscriptions").upsert(
      {
        venue_id: venue.id,
        plan,
        billing_interval: interval,
        status: trialEnd ? "trialing" : "active",
        payroll_addon: payrollAddon && !PLANS[plan].includesPayroll,
        trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
        current_period_end: null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "venue_id" }
    );
    redirect(`/admin/billing?venueId=${venue.id}&status=success`);
  }

  const { data } = await (await createSessionClient()).auth.getUser();
  const session = await new PaymentService().api().checkout.sessions.create(
    checkoutParams({ venue, plan, interval, payrollAddon, customerId: subscription?.stripe_customer_id, email: data.user?.email })
  );
  if (!session.url) throw new Error("Stripe did not return a checkout page.");
  redirect(session.url);
}

export async function manageBilling(formData: FormData) {
  const venueId = String(formData.get("venueId"));
  const { subscription } = await venueFor(venueId);
  if (isDemoMode() || !subscription?.stripe_customer_id) redirect(`/admin/billing?venueId=${venueId}`);
  const portal = await new PaymentService().api().billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${appConfig.appUrl}/admin/billing?venueId=${venueId}`
  });
  redirect(portal.url);
}
