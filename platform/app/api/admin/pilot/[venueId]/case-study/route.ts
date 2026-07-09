import { createServiceClient } from "@/lib/supabase/server";
import { caseStudyMarkdown, PilotService } from "@/lib/services/PilotService";

export async function GET(_: Request, { params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const profile = await new PilotService(createServiceClient()).getVenueProfile(venueId);
  return new Response(caseStudyMarkdown(profile), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename=${profile.venue.slug}-case-study.md`
    }
  });
}
