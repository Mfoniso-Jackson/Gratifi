import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const result = await createServiceClient()
    .from("recognition_events")
    .select("id,created_at,venue_id,worker_id,amount_pence,currency,recognition_hash,moonbeam_status,moonbeam_tx_hash");

  const rows = result.data ?? [];
  const header = ["id", "created_at", "venue_id", "worker_id", "amount_pence", "currency", "recognition_hash", "moonbeam_status", "moonbeam_tx_hash"];
  const csv = [header.join(","), ...rows.map((row: any) => header.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=gratifi-recognitions.csv"
    }
  });
}
