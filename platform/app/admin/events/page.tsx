import { revalidatePath } from "next/cache";
import { AdminShell, Stat } from "@/components/Shell";
import { paymentPill, recordPill } from "@/components/StatusPill";
import { createServiceClient } from "@/lib/supabase/server";
import { canAccessVenue, requireAdmin, scopeToVenues } from "@/lib/auth/access";
import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { txUrl } from "@/lib/explorer";

export const dynamic = "force-dynamic";

async function retryRecord(formData: FormData) {
  "use server";
  const context = await requireAdmin();
  const db = createServiceClient();
  const event = (await db.from("recognition_events").select("id, venue_id").eq("id", String(formData.get("eventId"))).maybeSingle()).data;
  if (!event || !canAccessVenue(context, event.venue_id)) throw new Error("Tip not found.");
  await new RecognitionEngine(db).retry(event.id);
  revalidatePath("/admin/events");
}

const FILTERS = [
  ["all", "All"],
  ["reversed", "Refunded or disputed"],
  ["unrecorded", "Not yet recorded"]
] as const;

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function TipsPage({ searchParams }: { searchParams: Promise<{ venueId?: string; show?: string }> }) {
  const context = await requireAdmin();
  const params = await searchParams;
  const db = createServiceClient();
  const venues = ((await scopeToVenues(db.from("venues").select("id, name"), context, "id").order("name")).data ?? []) as any[];
  const all = ((await scopeToVenues(db.from("recognition_events").select("*, venues(name), workers(display_name)"), context).order("created_at", { ascending: false })).data ?? []) as any[];

  const inVenue = params.venueId ? all.filter((e) => e.venue_id === params.venueId) : all;
  const show = FILTERS.some(([value]) => value === params.show) ? params.show : "all";
  const shown = inVenue
    .filter((e) => (show === "reversed" ? REVERSED_STRIPE_STATUSES.includes(e.stripe_status) : show === "unrecorded" ? e.moonbeam_status !== "confirmed" : true))
    .slice(0, 200);
  const counted = inVenue.filter((e) => !REVERSED_STRIPE_STATUSES.includes(e.stripe_status));
  const exportUrl = "/api/admin/export";

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Tips</h1>
        <a className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-medium" href={exportUrl}>Export CSV</a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tips" value={String(counted.length)} />
        <Stat label="Total to staff" value={`£${(counted.reduce((s, e) => s + e.amount_pence, 0) / 100).toFixed(2)}`} />
        <Stat label="Refunded or disputed" value={String(inVenue.length - counted.length)} />
        <Stat label="Not yet recorded" value={String(inVenue.filter((e) => e.moonbeam_status !== "confirmed").length)} />
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3">
        {venues.length > 1 && (
          <label className="grid gap-1 text-sm">
            Venue
            <select id="tips-venue" name="venueId" defaultValue={params.venueId ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2">
              <option value="">All venues</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
        )}
        <label className="grid gap-1 text-sm">
          Show
          <select id="tips-show" name="show" defaultValue={show} className="rounded-md border border-ink/15 bg-white px-3 py-2">
            {FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="rounded-md border border-ink/15 bg-white px-4 py-2">Apply</button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-white">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-[#eef4f1]">
            <tr>{["Date", "Staff", "Venue", "Amount", "Note", "Payment", "Permanent record"].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-ink/60">No tips match.</td></tr>
            )}
            {shown.map((event) => {
              const tx = txUrl(event.moonbeam_tx_hash);
              return (
                <tr key={event.id} className="border-t border-ink/10 align-top">
                  <td className="whitespace-nowrap p-3 text-ink/70">{day(event.created_at)}</td>
                  <td className="p-3 font-medium">{event.workers?.display_name}</td>
                  <td className="p-3">{event.venues?.name}</td>
                  <td className="p-3 tabular-nums">£{(event.amount_pence / 100).toFixed(2)}</td>
                  <td className="max-w-[240px] p-3 text-ink/70"><span className="line-clamp-2">{event.message ?? "—"}</span></td>
                  <td className="p-3">{paymentPill(event.stripe_status)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {recordPill(event.moonbeam_status)}
                      {tx && <a href={tx} target="_blank" rel="noreferrer" className="text-xs underline">View</a>}
                      {event.moonbeam_status !== "confirmed" && (
                        <form action={retryRecord}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <button className="text-xs underline">Retry now</button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink/50">Showing up to 200 tips. Refunded and disputed tips stay listed but don&apos;t count in totals.</p>
    </AdminShell>
  );
}
