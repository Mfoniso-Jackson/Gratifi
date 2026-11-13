import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, scopeToVenues } from "@/lib/auth/access";
import { isDemoMode } from "@/lib/demo/mode";
import { formatPence, PAYROLL_ADDON_PENCE, pilotDaysLeft, PLANS, priceFor } from "@/lib/billing/plans";
import { choosePlan, manageBilling } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Free pilot, plan chosen",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Cancelled",
  unpaid: "Unpaid",
  incomplete: "Waiting for payment"
};

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null);

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ venueId?: string; status?: string }> }) {
  const context = await requireAdmin();
  const params = await searchParams;
  const db = createServiceClient();
  const venues = ((await scopeToVenues(db.from("venues").select("id, name, created_at"), context, "id").order("name")).data ?? []) as any[];
  const venue = venues.find((v) => v.id === params.venueId) ?? venues.at(0);

  if (!venue) {
    return (
      <AdminShell>
        <h1 className="text-3xl font-bold">Plan and billing</h1>
        <p className="mt-4 text-ink/70">You don&apos;t have a venue yet.</p>
      </AdminShell>
    );
  }

  const subscription = (await db.from("venue_subscriptions").select("*").eq("venue_id", venue.id).maybeSingle()).data as any;
  const live = subscription && ["trialing", "active", "past_due", "unpaid", "incomplete"].includes(subscription.status);
  const daysLeft = pilotDaysLeft(venue.created_at);

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Plan and billing</h1>
      {params.status === "success" && (
        <p className="mt-4 rounded-xl bg-mint px-4 py-3 text-sm text-[#1f5c34]">
          {isDemoMode() ? "Plan saved (demo mode, no payment taken)." : "Thanks. Your plan is set up; it can take a minute to show here."}
        </p>
      )}

      {venues.length > 1 && (
        <form className="mt-6 flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            Venue
            <select id="venueId" name="venueId" defaultValue={venue.id} className="rounded-md border border-ink/15 bg-white px-3 py-2">
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <button className="rounded-md border border-ink/15 bg-white px-4 py-2">Show</button>
        </form>
      )}

      <section className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
        <p className="text-sm text-ink/60">{venue.name}</p>
        {live ? (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">
                {PLANS[subscription.plan as keyof typeof PLANS]?.name ?? subscription.plan} · {subscription.billing_interval === "year" ? "yearly" : "monthly"}
                {subscription.payroll_addon ? " + payroll export" : ""}
              </p>
              <p className="text-sm text-ink/70">
                {STATUS_LABELS[subscription.status] ?? subscription.status}
                {subscription.trial_end && subscription.status === "trialing" ? ` · first payment ${date(subscription.trial_end)}` : ""}
                {subscription.current_period_end && subscription.status === "active" ? ` · renews ${date(subscription.current_period_end)}` : ""}
              </p>
            </div>
            <form action={manageBilling}>
              <input type="hidden" name="venueId" value={venue.id} />
              <button className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium">Manage billing</button>
            </form>
          </div>
        ) : (
          <p className="mt-1 text-xl font-semibold">
            {daysLeft > 0 ? `Free pilot: ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Your free pilot has ended. Choose a plan to keep GratiFi running."}
          </p>
        )}
      </section>

      {!live && (
        <>
          <p className="mt-8 text-sm text-ink/70">
            Choose a plan now and you won&apos;t pay until your pilot ends. Yearly plans get two months free.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <div key={plan.id} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5">
                <p className="text-lg font-semibold">{plan.name}</p>
                <p className="text-sm text-ink/60">{plan.summary}</p>
                <p className="mt-3 text-3xl font-bold tabular-nums">
                  {formatPence(plan.monthlyPence)}<span className="text-base font-normal text-ink/60"> / month{plan.id === "group" ? " per venue" : ""}</span>
                </p>
                <ul className="mt-3 grid flex-1 content-start gap-1 text-sm text-ink/80">
                  {plan.features.map((feature) => <li key={feature}>· {feature}</li>)}
                </ul>
                {plan.selfServe ? (
                  <form action={choosePlan} className="mt-4 grid gap-3">
                    <input type="hidden" name="venueId" value={venue.id} />
                    <input type="hidden" name="plan" value={plan.id} />
                    <label className="grid gap-1 text-sm">
                      Billing
                      <select id={`interval-${plan.id}`} name="interval" className="rounded-md border border-ink/15 px-3 py-2">
                        <option value="month">Monthly, {formatPence(priceFor(plan.id, "month"))}</option>
                        <option value="year">Yearly, {formatPence(priceFor(plan.id, "year"))}</option>
                      </select>
                    </label>
                    {!plan.includesPayroll && (
                      <label className="flex items-center gap-2 text-sm">
                        <input id={`addon-${plan.id}`} type="checkbox" name="payrollAddon" />
                        Add payroll export (+{formatPence(PAYROLL_ADDON_PENCE)}/month)
                      </label>
                    )}
                    <button className="rounded-full bg-ink px-4 py-2.5 font-medium text-white">Choose {plan.name}</button>
                  </form>
                ) : (
                  <p className="mt-4 rounded-xl bg-[#f6f7f2] px-4 py-3 text-sm text-ink/70">For 10 or more venues. Ask your GratiFi contact to set it up.</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}
