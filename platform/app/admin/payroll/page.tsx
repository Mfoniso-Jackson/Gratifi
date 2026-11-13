import Link from "next/link";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, scopeToVenues } from "@/lib/auth/access";
import { venueCanUsePayroll } from "@/lib/billing/access";
import { isValidPeriod, lastMonth, payrollRows } from "@/lib/services/PayrollService";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ venueId?: string; from?: string; to?: string }> }) {
  const context = await requireAdmin();
  const params = await searchParams;
  const db = createServiceClient();
  const venues = ((await scopeToVenues(db.from("venues").select("id, name, created_at"), context, "id").order("name")).data ?? []) as any[];
  const venue = venues.find((v) => v.id === params.venueId) ?? venues.at(0);
  const fallback = lastMonth();
  const period = isValidPeriod({ from: params.from, to: params.to }) ? { from: params.from!, to: params.to! } : fallback;

  if (!venue) {
    return (
      <AdminShell>
        <h1 className="text-3xl font-bold">Payroll export</h1>
        <p className="mt-4 text-ink/70">You don&apos;t have a venue yet.</p>
      </AdminShell>
    );
  }

  const allowed = await venueCanUsePayroll(db, venue, context.role === "admin");
  const [workers, events] = await Promise.all([
    db.from("workers").select("*").eq("venue_id", venue.id),
    db.from("recognition_events").select("*").eq("venue_id", venue.id)
  ]);
  const rows = payrollRows(events.data ?? [], workers.data ?? [], period);
  const totals = rows.reduce((acc, row) => ({ net: acc.net + row.net_pence, tips: acc.tips + row.tips }), { net: 0, tips: 0 });
  const download = `/api/admin/payroll-export?venueId=${venue.id}&from=${period.from}&to=${period.to}`;

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Payroll export</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Tips each staff member received in a period, ready for payroll or your tronc. Refunded and disputed tips are
        listed but taken out of the net amount.
      </p>

      <form className="mt-6 grid gap-3 rounded-xl border border-ink/10 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <label className="grid gap-1 text-sm">
          Venue
          <select id="venueId" name="venueId" defaultValue={venue.id} className="rounded-md border border-ink/15 px-3 py-2">
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          From
          <input id="from" type="date" name="from" defaultValue={period.from} className="rounded-md border border-ink/15 px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm">
          To
          <input id="to" type="date" name="to" defaultValue={period.to} className="rounded-md border border-ink/15 px-3 py-2" />
        </label>
        <button className="rounded-md border border-ink/15 px-4 py-2">Show</button>
      </form>

      {!allowed ? (
        <div className="mt-6 rounded-xl border border-ink/10 bg-white p-5">
          <p className="font-semibold">Payroll export is part of the Pro plan</p>
          <p className="mt-1 text-sm text-ink/70">Upgrade to Pro, or add it to Starter, to download payroll files.</p>
          <Link href="/admin/billing" className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm text-white">See plans</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/70">
              {venue.name} · {period.from} to {period.to} · {totals.tips} tips · <strong className="text-ink">{pounds(totals.net)} net</strong>
            </p>
            <a href={download} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">Download CSV</a>
          </div>
          <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#eef4f1]">
                <tr>{["Staff", "Role", "Tips", "Gross", "Refunded or disputed", "Net"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.worker_id} className="border-t border-ink/10 tabular-nums">
                    <td className="p-3 font-medium">{row.staff_name}</td>
                    <td className="p-3">{row.role}</td>
                    <td className="p-3">{row.tips}</td>
                    <td className="p-3">{pounds(row.gross_pence)}</td>
                    <td className="p-3">{pounds(row.reversed_pence)}</td>
                    <td className="p-3 font-semibold">{pounds(row.net_pence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminShell>
  );
}
