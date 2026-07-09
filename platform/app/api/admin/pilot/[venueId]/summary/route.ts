import { createServiceClient } from "@/lib/supabase/server";
import { PilotService, venueSummaryJson } from "@/lib/services/PilotService";

export async function GET(_: Request, { params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const profile = await new PilotService(createServiceClient()).getVenueProfile(venueId);
  return Response.json(venueSummaryJson(profile), {
    headers: {
      "content-disposition": `attachment; filename=${profile.venue.slug}-pilot-summary.json`
    }
  });
}
