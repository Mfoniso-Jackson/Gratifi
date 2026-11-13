import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, requireGlobalAdmin, scopeToVenues } from "@/lib/auth/access";
import { venueAccess } from "@/lib/billing/plans";
import { newReferralCode, slugify } from "@/lib/services/SignupService";
import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";

export const dynamic = "force-dynamic";

async function createVenue(formData: FormData) {
  "use server";
  await requireGlobalAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Enter the venue's name.");
  const db = createServiceClient();
  await db.from("venues").insert({
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    address: String(formData.get("address") ?? "").trim() || null,
    status: "active",
    referral_code: newReferralCode()
  });
  revalidatePath("/admin/venues");
}

const STATE_PILL = {
  pilot: (days: number) => <StatusPill tone="neutral">Pilot · {days}d left</StatusPill>,
  grace: (days: number) => <StatusPill tone="warn">Choose a plan · {days}d</StatusPill>,
  paid: () => <StatusPill tone="good">Paying</StatusPill>,
  paused: () => <StatusPill tone="bad">Not taking tips</StatusPill>
};

const input = "rounded-md border border-ink/15 bg-white px-3 py-2";

export default async function VenuesPage() {
  const context = await requireAdmin();
  const db = createServiceClient();
  const [venues, workers, events, subscriptions] = await Promise.all([
    scopeToVenues(db.from("venues").select("*"), context, "id").order("created_at", { ascending: false }),
    scopeToVenues(db.from("workers").select("id, venue_id, status"), context),
    scopeToVenues(db.from("recognition_events").select("venue_id, amount_pence, stripe_status, created_at"), context),
    scopeToVenues(db.from("venue_subscriptions").select("venue_id, status"), context)
  ]);
  const month = new Date().toISOString().slice(0, 7);
  const rows = ((venues.data ?? []) as any[]).map((venue) => {
    const venueEvents = ((events.data ?? []) as any[]).filter((e) => e.venue_id === venue.id && !REVERSED_STRIPE_STATUSES.includes(e.stripe_status));
    const thisMonth = venueEvents.filter((e) => String(e.created_at).startsWith(month));
    const subscription = ((subscriptions.data ?? []) as any[]).find((s) => s.venue_id === venue.id) ?? null;
    return {
      venue,
      staff: ((workers.data ?? []) as any[]).filter((w) => w.venue_id === venue.id && w.status === "active").length,
      tipsThisMonth: thisMonth.length,
      totalThisMonth: thisMonth.reduce((sum, e) => sum + e.amount_pence, 0),
      access: venueAccess(venue, subscription)
    };
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">{context.role === "admin" ? "Venues" : "My venues"}</h1>
      <p className="mt-2 text-ink/70">QR codes, referral links, plans and sponsor settings live on each venue&apos;s page.</p>

      {rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-ink/20 p-8 text-center text-ink/60">No venues yet.</p>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {rows.map(({ venue, staff, tipsThisMonth, totalThisMonth, access }) => (
            <Link key={venue.id} href={`/admin/venues/${venue.id}`} className="grid gap-3 rounded-xl border border-ink/10 bg-white p-5 transition hover:border-ink/30">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{venue.name}</p>
                  <p className="truncate text-sm text-ink/60">{venue.address ?? `/v/${venue.slug}`}</p>
                </div>
                {venue.billing_exempt ? <StatusPill tone="good">Comped</StatusPill> : STATE_PILL[access.state](access.daysLeft)}
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm tabular-nums">
                <div><dt className="text-ink/50">Staff</dt><dd className="font-semibold">{staff}</dd></div>
                <div><dt className="text-ink/50">Tips this month</dt><dd className="font-semibold">{tipsThisMonth}</dd></div>
                <div><dt className="text-ink/50">Amount</dt><dd className="font-semibold">£{(totalThisMonth / 100).toFixed(2)}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      )}

      {context.role === "admin" && (
        <section className="mt-8 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-semibold">Add a venue</h2>
          <p className="text-sm text-ink/60">Most venues sign up themselves at /for-venues. Use this for ones you onboard by hand.</p>
          <form action={createVenue} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label className="grid gap-1 text-sm">Name<input id="venue-name" name="name" required className={input} /></label>
            <label className="grid gap-1 text-sm">Web address (optional)<input id="venue-slug" name="slug" placeholder="made from the name" className={input} /></label>
            <label className="grid gap-1 text-sm">Address (optional)<input id="venue-address" name="address" className={input} /></label>
            <button className="rounded-md bg-ink px-4 py-2 text-white">Add venue</button>
          </form>
        </section>
      )}
    </AdminShell>
  );
}
