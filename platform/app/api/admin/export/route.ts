import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAccess, scopeToVenues } from "@/lib/auth/access";

export async function GET() {
  const context = await adminApiAccess();
  if (context instanceof Response) return context;
  const result = await scopeToVenues(
    createServiceClient()
      .from("recognition_events")
      .select("id,created_at,venue_id,worker_id,amount_pence,currency,stripe_status,recognition_hash,anchor_status,anchor_tx_hash"),
    context
  );

  const rows = result.data ?? [];
  const header = ["id", "created_at", "venue_id", "worker_id", "amount_pence", "currency", "stripe_status", "recognition_hash", "anchor_status", "anchor_tx_hash"];
  const csv = [header.join(","), ...rows.map((row: any) => header.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=gratifi-recognitions.csv"
    }
  });
}
