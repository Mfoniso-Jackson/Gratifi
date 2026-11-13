import { createServiceClient } from "@/lib/supabase/server";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";
import { chainInfo } from "@/lib/chains";
import { txUrl } from "@/lib/explorer";

export async function GET(_: Request, { params }: { params: Promise<{ recognitionHash: string }> }) {
  const { recognitionHash } = await params;
  const result = await createServiceClient()
    .from("recognition_events")
    .select("recognition_hash, anchor_status, anchor_tx_hash, anchor_block_number, anchor_chain_id, anchor_contract_address, confirmed_at, protocol_version")
    .eq("recognition_hash", recognitionHash)
    .single();
  if (result.error) return protocolError("Recognition was not found", 404);
  const record = result.data as any;
  const network = chainInfo(record.anchor_chain_id);
  return Response.json(
    protocolResponse({
      ...record,
      network: network?.name ?? null,
      network_retired: Boolean(network?.retired),
      explorer_url: txUrl(record.anchor_tx_hash, record.anchor_chain_id)
    })
  );
}
