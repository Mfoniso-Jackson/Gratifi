import { AdminShell, Stat } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = createServiceClient();
  const events = await db.from("recognition_events").select("amount_pence, moonbeam_status");
  const rows = events.data ?? [];
  const total = rows.reduce((sum: number, event: any) => sum + event.amount_pence, 0);

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Recognitions" value={String(rows.length)} />
        <Stat label="Total" value={`£${(total / 100).toFixed(2)}`} />
        <Stat label="Pending anchoring" value={String(rows.filter((e: any) => e.moonbeam_status !== "confirmed").length)} />
      </div>
    </AdminShell>
  );
}
