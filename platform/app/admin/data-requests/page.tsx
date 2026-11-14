import Link from "next/link";
import { AdminShell } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TYPE = { access: "Copy of data", delete: "Delete data", correct: "Correct data" } as Record<string, string>;
const WHO = { customer: "Customer", staff: "Staff member", venue_owner: "Venue owner", other: "Other" } as Record<string, string>;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function DataRequestsAdminPage() {
  await requireGlobalAdmin();
  const rows = ((await createServiceClient().from("data_requests").select("*").order("created_at", { ascending: false })).data ?? []) as any[];
  const today = new Date().toISOString().slice(0, 10);
  const open = rows.filter((r) => r.status === "received" || r.status === "in_progress").sort((a, b) => (a.due_on < b.due_on ? -1 : 1));
  const closed = rows.filter((r) => r.status === "completed" || r.status === "rejected");

  const table = (list: any[]) => (
    <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-[#eef4f1]"><tr>{["Reference", "Request", "From", "Received", "Reply by", "Status"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/60">None.</td></tr>}
          {list.map((r) => {
            const overdue = (r.status === "received" || r.status === "in_progress") && r.due_on < today;
            return (
              <tr key={r.id} className="border-t border-ink/10">
                <td className="p-3"><Link href={`/admin/data-requests/${r.id}`} className="font-mono font-medium underline">{r.reference}</Link></td>
                <td className="p-3">{TYPE[r.request_type]}</td>
                <td className="p-3">{WHO[r.requester_type]} · {r.email}</td>
                <td className="p-3">{day(r.created_at)}</td>
                <td className="p-3">{overdue ? <StatusPill tone="bad">Overdue · {day(r.due_on)}</StatusPill> : day(r.due_on)}</td>
                <td className="p-3">
                  <StatusPill tone={r.status === "completed" ? "good" : r.status === "rejected" ? "neutral" : "warn"}>{r.status.replace("_", " ")}</StatusPill>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Data requests</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Requests from <span className="font-mono text-sm">/privacy/requests</span>. UK GDPR gives one month to reply. Confirm who the person
        is before sending data or deleting anything.
      </p>
      <h2 className="mt-8 text-xl font-semibold">Open ({open.length})</h2>
      {table(open)}
      <h2 className="mt-8 text-xl font-semibold">Closed</h2>
      {table(closed)}
    </AdminShell>
  );
}
