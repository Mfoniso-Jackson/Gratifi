import { createServiceClient } from "@/lib/supabase/server";
import { VenueService } from "@/lib/services/VenueService";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";

export async function GET() {
  const result = await new VenueService(createServiceClient()).listActive();
  if (result.error) return protocolError(result.error.message, 500);
  return Response.json(protocolResponse(result.data));
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await new VenueService(createServiceClient()).upsert(body);
  if (result.error) return protocolError(result.error.message, 400);
  return Response.json(protocolResponse(result.data), { status: 201 });
}
