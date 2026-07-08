import { createServiceClient } from "@/lib/supabase/server";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const event = await new RecognitionEngine(createServiceClient()).retry(eventId);
  return Response.json({ data: event });
}
