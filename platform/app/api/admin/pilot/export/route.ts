import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAccess } from "@/lib/auth/access";
import { PilotService, pilotSummaryRows } from "@/lib/services/PilotService";

export async function GET() {
  const access = await adminApiAccess({ globalOnly: true });
  if (access instanceof Response) return access;
  const metrics = await new PilotService(createServiceClient()).listPilotVenues();
  const rows = pilotSummaryRows(metrics);
  const header = Object.keys(rows[0] ?? {
    venue_id: "",
    venue_name: "",
    venue_type: "",
    pilot_status: "",
    workers_onboarded: "",
    qr_codes_generated: "",
    recognition_events: "",
    total_tip_volume_gbp: "",
    moonbeam_confirmation_rate: "",
    stripe_success_rate: "",
    follow_up_date: ""
  });
  const csv = [header.join(","), ...rows.map((row: any) => header.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=gratifi-pilot-metrics.csv"
    }
  });
}
