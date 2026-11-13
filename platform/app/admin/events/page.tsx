import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, scopeToVenues } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const context = await requireAdmin();
  const db = createServiceClient();
  const events = await scopeToVenues(db.from("recognition_events").select("*, venues(name), workers(display_name)"), context)
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AdminShell>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Events</h1>
        <a className="rounded-md border border-ink/15 px-4 py-2" href="/api/admin/export">Export CSV</a>
      </div>
      <div className="mt-6 overflow-x-auto rounded-md border border-ink/10 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-[#eef4f1]">
            <tr>
              {["Worker", "Venue", "Amount", "Payment", "Moonbeam", "Tx", "Created"].map((h) => <th key={h} className="p-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {(events.data ?? []).map((event: any) => (
              <tr key={event.id} className="border-t border-ink/10">
                <td className="p-3">{event.workers?.display_name}</td>
                <td className="p-3">{event.venues?.name}</td>
                <td className="p-3">£{(event.amount_pence / 100).toFixed(2)}</td>
                <td className="p-3">{String(event.stripe_status).replaceAll("_", " ")}</td>
                <td className="p-3">{event.moonbeam_status}</td>
                <td className="max-w-[220px] truncate p-3">{event.moonbeam_tx_hash ?? "—"}</td>
                <td className="p-3">{new Date(event.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
