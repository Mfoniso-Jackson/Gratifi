import { createServiceClient } from "@/lib/supabase/server";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";

export async function GET(_: Request, { params }: { params: Promise<{ recognitionHash: string }> }) {
  const { recognitionHash } = await params;
  const result = await createServiceClient()
    .from("recognition_events")
    .select("recognition_hash, moonbeam_status, moonbeam_tx_hash, moonbeam_block_number, confirmed_at, protocol_version")
    .eq("recognition_hash", recognitionHash)
    .single();
  if (result.error) return protocolError("Recognition was not found", 404);
  return Response.json(protocolResponse(result.data));
}
