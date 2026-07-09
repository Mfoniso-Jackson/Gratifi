import Link from "next/link";
import { AdminShell, Stat } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { formatMoney, percent, PilotService } from "@/lib/services/PilotService";

export const dynamic = "force-dynamic";

export default async function PilotDashboardPage() {
  const metrics = await new PilotService(createServiceClient()).listPilotVenues();
  const totals = metrics.reduce(
    (acc, item) => ({
      venues: acc.venues + (item.venue.pilot_status !== "completed" ? 1 : 0),
      workers: acc.workers + item.workerCount,
      qrCodes: acc.qrCodes + item.qrCodesGenerated,
      recognitions: acc.recognitions + item.recognitionCount,
      tipPence: acc.tipPence + item.totalTipPence,
      confirmed: acc.confirmed + item.moonbeamConfirmationRate * item.recognitionCount,
      stripeSuccess: acc.stripeSuccess + item.stripeSuccessRate * item.recognitionCount
    }),
    { venues: 0, workers: 0, qrCodes: 0, recognitions: 0, tipPence: 0, confirmed: 0, stripeSuccess: 0 }
  );

  const confirmationRate = totals.recognitions > 0 ? totals.confirmed / totals.recognitions : 0;
  const stripeRate = totals.recognitions > 0 ? totals.stripeSuccess / totals.recognitions : 0;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">Pilot operations</p>
          <h1 className="text-3xl font-bold">Pilot Dashboard</h1>
        </div>
        <a className="rounded-md border border-ink/15 bg-white px-4 py-2" href="/api/admin/pilot/export">Export pilot CSV</a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active pilot venues" value={String(totals.venues)} />
        <Stat label="Workers onboarded" value={String(totals.workers)} />
        <Stat label="QR codes generated" value={String(totals.qrCodes)} />
        <Stat label="Total tip volume" value={`£${formatMoney(totals.tipPence)}`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Recognition events" value={String(totals.recognitions)} />
        <Stat label="Moonbeam confirmation rate" value={percent(confirmationRate)} />
        <Stat label="Stripe success rate" value={percent(stripeRate)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-ink/10 bg-white">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-[#eef4f1]">
            <tr>
              {["Venue", "Type", "Status", "Workers", "QRs", "Events", "Tip volume", "Moonbeam", "Stripe", "Follow-up"].map((h) => (
                <th key={h} className="p-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((item) => (
              <tr key={item.venue.id} className="border-t border-ink/10">
                <td className="p-3">
                  <Link className="font-semibold hover:text-coral" href={`/admin/pilot/${item.venue.id}`}>{item.venue.name}</Link>
                  <p className="text-xs text-ink/50">{item.venue.contact_name ?? "No contact"}</p>
                </td>
                <td className="p-3">{item.venue.venue_type ?? "other"}</td>
                <td className="p-3">{item.venue.pilot_status ?? "prospect"}</td>
                <td className="p-3">{item.workerCount}</td>
                <td className="p-3">{item.qrCodesGenerated}</td>
                <td className="p-3">{item.recognitionCount}</td>
                <td className="p-3">£{formatMoney(item.totalTipPence)}</td>
                <td className="p-3">{percent(item.moonbeamConfirmationRate)}</td>
                <td className="p-3">{percent(item.stripeSuccessRate)}</td>
                <td className="p-3">{item.venue.follow_up_date ?? "Not set"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
