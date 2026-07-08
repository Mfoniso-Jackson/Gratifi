import { createServiceClient } from "@/lib/supabase/server";
import { WorkerService } from "@/lib/services/WorkerService";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";

export async function GET(request: Request) {
  const venueId = new URL(request.url).searchParams.get("venueId");
  if (!venueId) return protocolError("venueId is required");
  const result = await new WorkerService(createServiceClient()).listByVenue(venueId);
  if (result.error) return protocolError(result.error.message, 500);
  return Response.json(protocolResponse(result.data));
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await new WorkerService(createServiceClient()).upsert(body);
  if (result.error) return protocolError(result.error.message, 400);
  return Response.json(protocolResponse(result.data), { status: 201 });
}
