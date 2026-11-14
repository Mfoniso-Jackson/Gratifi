import { createServiceClient } from "@/lib/supabase/server";
import { protocolError } from "@/lib/services/ProtocolApiService";

/** Downloads a batch's OpenTimestamps proof (a standard detached .ots file) for one calendar. */
export async function GET(request: Request, { params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(batchId)) return protocolError("Batch was not found", 404);
  const batch = (await createServiceClient().from("anchor_batches").select("merkle_root, ots_proofs").eq("id", batchId).maybeSingle()).data as any;
  const index = Number(new URL(request.url).searchParams.get("calendar") ?? 0);
  const entry = batch?.ots_proofs?.[Number.isInteger(index) ? index : 0];
  if (!entry?.proof) return protocolError("No Bitcoin proof for this batch yet", 404);
  return new Response(Buffer.from(entry.proof, "base64"), {
    headers: {
      "Content-Type": "application/octet-stream",
      // Named after the root file so `ots verify` finds it next to root.bin.
      "Content-Disposition": `attachment; filename="root.bin.ots"`,
      "Cache-Control": "public, max-age=300"
    }
  });
}
