import { appConfig } from "@/lib/config";
import { ChainService } from "@/lib/services/ChainService";
import { buildMerkleBatch } from "@/lib/anchoring/merkle";
import { stampRoot, type OtsProof } from "@/lib/anchoring/opentimestamps";

export interface BatchChain {
  isConfigured(): boolean;
  recordBatch(merkleRoot: string, leafCount: number): Promise<{ txHash: string | null; blockNumber: number | null; chainId: number }>;
}

export type BatchOutcome =
  | { action: "skipped"; reason: string }
  | { action: "recorded"; batchId: string; merkleRoot: string; tips: number; bitcoinBackup: number }
  | { action: "failed"; batchId: string; tips: number; error: string };

/**
 * The hourly job: collects every tip waiting for its permanent record, writes one Merkle root for
 * all of them to Base, stores each tip's proof, then stamps the root on Bitcoin with OpenTimestamps.
 *
 * If the Base write fails, the tips go back to "retry" and are picked up by the next run.
 */
export class AnchorBatchService {
  constructor(
    private readonly db: any,
    private readonly chain: BatchChain = new ChainService(),
    private readonly stamp: (root: string) => Promise<OtsProof[]> = (root) => stampRoot(root)
  ) {}

  async run(options: { limit?: number } = {}): Promise<BatchOutcome> {
    if (!this.chain.isConfigured()) return { action: "skipped", reason: "The blockchain record is not configured" };

    await this.retryBitcoinBackups();

    const waiting = await this.db
      .from("recognition_events")
      .select("id, recognition_hash, anchor_status, anchor_batch_id, created_at")
      .in("anchor_status", ["pending", "retry"])
      .order("created_at")
      .limit(options.limit ?? 5000);
    if (waiting.error) throw waiting.error;
    // Tips already in a batch that is being written are left alone.
    const tips = ((waiting.data ?? []) as any[]).filter((tip) => !tip.anchor_batch_id || tip.anchor_status === "retry");
    if (tips.length === 0) return { action: "skipped", reason: "No tips waiting" };

    const { root, proofs } = buildMerkleBatch(tips.map((tip) => tip.recognition_hash));
    const created = await this.db
      .from("anchor_batches")
      .insert({
        merkle_root: root,
        leaf_count: tips.length,
        chain_id: appConfig.chain.chainId,
        contract_address: appConfig.chain.contractAddress || null,
        status: "pending"
      })
      .select("*")
      .single();
    if (created.error) throw created.error;
    const batch = created.data;

    for (const [i, tip] of tips.entries()) {
      await this.db.from("recognition_events").update({ anchor_batch_id: batch.id, merkle_proof: proofs[i] }).eq("id", tip.id);
    }

    let result: Awaited<ReturnType<BatchChain["recordBatch"]>>;
    try {
      result = await this.chain.recordBatch(root, tips.length);
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown error";
      await this.db.from("anchor_batches").update({ status: "failed", error: message }).eq("id", batch.id);
      for (const tip of tips) {
        await this.db.from("recognition_events").update({ anchor_status: "retry", anchor_batch_id: null, merkle_proof: null }).eq("id", tip.id);
      }
      return { action: "failed", batchId: batch.id, tips: tips.length, error: message };
    }

    const confirmedAt = new Date().toISOString();
    await this.db
      .from("anchor_batches")
      .update({ status: "confirmed", tx_hash: result.txHash, block_number: result.blockNumber, chain_id: result.chainId, confirmed_at: confirmedAt })
      .eq("id", batch.id);
    await this.db
      .from("recognition_events")
      .update({
        anchor_status: "confirmed",
        anchor_tx_hash: result.txHash,
        anchor_block_number: result.blockNumber,
        anchor_chain_id: result.chainId,
        anchor_contract_address: appConfig.chain.contractAddress || null,
        confirmed_at: confirmedAt
      })
      .eq("anchor_batch_id", batch.id);

    const backups = await this.backUpToBitcoin(batch.id, root);
    return { action: "recorded", batchId: batch.id, merkleRoot: root, tips: tips.length, bitcoinBackup: backups };
  }

  private async backUpToBitcoin(batchId: string, root: string) {
    const proofs = await this.stamp(root).catch(() => [] as OtsProof[]);
    await this.db
      .from("anchor_batches")
      .update({ ots_status: proofs.length ? "submitted" : "failed", ots_proofs: proofs })
      .eq("id", batchId);
    return proofs.length;
  }

  /** Confirmed batches whose Bitcoin backup failed (calendars down) get another go, a few per run. */
  private async retryBitcoinBackups() {
    const missed = await this.db.from("anchor_batches").select("id, merkle_root, status, ots_status").eq("status", "confirmed").eq("ots_status", "failed").limit(5);
    for (const batch of (missed.data ?? []) as any[]) await this.backUpToBitcoin(batch.id, batch.merkle_root);
  }
}
