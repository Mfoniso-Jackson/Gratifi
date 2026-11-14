import { ethers } from "ethers";
import { createServiceClient } from "@/lib/supabase/server";
import { protocolError } from "@/lib/services/ProtocolApiService";

/** Downloads a batch's Merkle root as the 32-byte file that the .ots proof timestamps. */
export async function GET(_: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(batchId)) return protocolError("Batch was not found", 404);
  const batch = (await createServiceClient().from("anchor_batches").select("merkle_root").eq("id", batchId).maybeSingle()).data as any;
  if (!batch) return protocolError("Batch was not found", 404);
  return new Response(Buffer.from(ethers.getBytes(batch.merkle_root)), {
    headers: { "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="root.bin"`, "Cache-Control": "public, max-age=86400" }
  });
}
