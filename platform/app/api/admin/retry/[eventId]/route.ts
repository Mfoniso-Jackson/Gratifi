import { createServiceClient } from "@/lib/supabase/server";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { adminApiAccess, canAccessVenue } from "@/lib/auth/access";

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const context = await adminApiAccess();
  if (context instanceof Response) return context;
  const { eventId } = await params;
  const db = createServiceClient();
  const existing = await db.from("recognition_events").select("venue_id").eq("id", eventId).maybeSingle();
  if (!existing.data || !canAccessVenue(context, existing.data.venue_id)) {
    return Response.json({ error: "Recognition not found." }, { status: 404 });
  }
  const event = await new RecognitionEngine(db).retry(eventId);
  return Response.json({ data: event });
}
