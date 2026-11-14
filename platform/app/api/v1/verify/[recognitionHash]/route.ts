import { createServiceClient } from "@/lib/supabase/server";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";
import { chainInfo } from "@/lib/chains";
import { txUrl } from "@/lib/explorer";
import { verifyMerkleProof } from "@/lib/anchoring/merkle";

/**
 * Public check of a tip's permanent record. For tips recorded in an hourly batch it also returns the
 * batch's Merkle root and the tip's proof, so anyone can recompute the root themselves, call the
 * contract's verifyInBatch, or check the Bitcoin backup (.ots file).
 */
export async function GET(request: Request, { params }: { params: Promise<{ recognitionHash: string }> }) {
  const { recognitionHash } = await params;
  const db = createServiceClient();
  const result = await db
    .from("recognition_events")
    .select("recognition_hash, anchor_status, anchor_tx_hash, anchor_block_number, anchor_chain_id, anchor_contract_address, anchor_batch_id, merkle_proof, confirmed_at, protocol_version")
    .eq("recognition_hash", recognitionHash)
    .single();
  if (result.error) return protocolError("Recognition was not found", 404);
  const { anchor_batch_id: batchId, merkle_proof: proof, ...record } = result.data as any;
  const network = chainInfo(record.anchor_chain_id);

  let batch = null;
  if (batchId) {
    const row = (await db.from("anchor_batches").select("id, merkle_root, leaf_count, status, tx_hash, ots_status, ots_proofs").eq("id", batchId).maybeSingle()).data as any;
    if (row) {
      const base = new URL(`/api/v1/batches/${row.id}`, request.url).toString();
      batch = {
        merkle_root: row.merkle_root,
        tips_in_batch: row.leaf_count,
        status: row.status,
        merkle_proof: proof ?? [],
        proof_valid: Array.isArray(proof) ? verifyMerkleProof(record.recognition_hash, proof, row.merkle_root) : false,
        bitcoin_backup: {
          status: row.ots_status,
          root_file: `${base}/root`,
          ots_files: ((row.ots_proofs ?? []) as any[]).map((_, i) => `${base}/ots?calendar=${i}`)
        }
      };
    }
  }

  return Response.json(
    protocolResponse({
      ...record,
      network: network?.name ?? null,
      network_retired: Boolean(network?.retired),
      explorer_url: txUrl(record.anchor_tx_hash, record.anchor_chain_id),
      batch
    })
  );
}
