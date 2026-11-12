import { createServiceClient } from "@/lib/supabase/server";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";

export const dynamic = "force-dynamic";

/**
 * Scheduled job (see vercel.json): retries Moonbeam anchoring for recognitions marked "retry"
 * or stuck in "pending". Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; any other
 * caller is refused, and the job does nothing until CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await new RecognitionEngine(createServiceClient()).retryStuck();
  return Response.json(result);
}
