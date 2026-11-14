import { z } from "zod";
import { appConfig, protocolVersion } from "@/lib/config";
import { HashService } from "@/lib/services/HashService";
import { ChainService } from "@/lib/services/ChainService";
import { AnchorBatchService } from "@/lib/anchoring/AnchorBatchService";
import type { RecognitionPayload } from "@/lib/types/domain";

const RecognitionSchema = z.object({
  venueId: z.string().uuid(),
  workerId: z.string().uuid(),
  amountPence: z.number().int().positive(),
  currency: z.literal("GBP"),
  message: z.string().trim().max(280).optional().nullable(),
  stripePaymentIntentId: z.string().min(3),
  stripeStatus: z.string().min(2),
  feeCoveredPence: z.number().int().min(0).max(10_000).optional()
});

export class RecognitionEngine {
  constructor(
    private readonly db: any,
    private readonly hashService = new HashService(),
    private readonly chainService = new ChainService(),
    private readonly mode: "batch" | "single" = appConfig.anchorMode,
    private readonly batches: () => { run(): Promise<unknown> } = () => new AnchorBatchService(db)
  ) {}

  validate(payload: RecognitionPayload) {
    const parsed = RecognitionSchema.parse(payload);
    if (parsed.amountPence < appConfig.minTipAmountPence || parsed.amountPence > appConfig.maxTipAmountPence) {
      throw new Error("Recognition amount is outside configured limits.");
    }
    return parsed;
  }

  async createFromPaidIntent(payload: RecognitionPayload) {
    const valid = this.validate(payload);
    if (valid.stripeStatus !== "succeeded" && valid.stripeStatus !== "paid") {
      throw new Error("Payment is not settled.");
    }

    const message = valid.message?.trim() || null;
    const recognitionHash = this.hashService.recognitionHash({ ...valid, message });
    const messageHash = this.hashService.messageHash(message);

    const existing = await this.db
      .from("recognition_events")
      .select("*")
      .eq("recognition_hash", recognitionHash)
      .maybeSingle();
    if (existing.data) return existing.data;

    const insert = await this.db
      .from("recognition_events")
      .insert({
        venue_id: valid.venueId,
        worker_id: valid.workerId,
        amount_pence: valid.amountPence,
        currency: valid.currency,
        message,
        message_hash: messageHash,
        recognition_hash: recognitionHash,
        stripe_payment_intent_id: valid.stripePaymentIntentId,
        stripe_status: valid.stripeStatus,
        fee_covered_pence: valid.feeCoveredPence ?? 0,
        anchor_status: "pending",
        anchor_contract_address: appConfig.chain.contractAddress || null,
        protocol_version: protocolVersion
      })
      .select("*")
      .single();

    if (insert.error) throw insert.error;
    // In batch mode the tip waits for the hourly batch instead of its own transaction.
    if (this.mode === "batch") return insert.data;
    return this.anchor(insert.data);
  }

  async anchor(event: any) {
    try {
      const result = await this.chainService.recordRecognition({
        recognitionHash: event.recognition_hash,
        venueHash: this.hashService.entityHash(event.venue_id),
        workerHash: this.hashService.entityHash(event.worker_id),
        messageHash: event.message_hash,
        amountPence: event.amount_pence
      });

      const update = await this.db
        .from("recognition_events")
        .update({
          anchor_status: "confirmed",
          anchor_tx_hash: result.txHash,
          anchor_block_number: result.blockNumber,
          anchor_chain_id: result.chainId,
          anchor_contract_address: appConfig.chain.contractAddress || null,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", event.id)
        .select("*")
        .single();

      if (update.error) throw update.error;
      return update.data;
    } catch (error) {
      await this.db.from("recognition_events").update({ anchor_status: "retry" }).eq("id", event.id);
      return { ...event, anchor_status: "retry" };
    }
  }

  /**
   * Re-anchors recognitions that failed (retry) or have sat in pending longer than `staleMinutes`.
   * Called by the scheduled job; processes at most `limit` per run, oldest first.
   */
  async retryStuck(options: { staleMinutes?: number; limit?: number; now?: Date } = {}) {
    if (this.mode === "batch") return this.batches().run();

    const staleMinutes = options.staleMinutes ?? 10;
    const limit = options.limit ?? 25;
    const cutoff = new Date((options.now ?? new Date()).getTime() - staleMinutes * 60_000).toISOString();

    const [retry, pending] = await Promise.all([
      this.db.from("recognition_events").select("*").eq("anchor_status", "retry").order("created_at").limit(limit),
      this.db.from("recognition_events").select("*").eq("anchor_status", "pending").order("created_at").limit(limit)
    ]);
    if (retry.error) throw retry.error;
    if (pending.error) throw pending.error;

    const due = [...(retry.data ?? []), ...(pending.data ?? []).filter((event: any) => event.created_at < cutoff)]
      .sort((a: any, b: any) => (a.created_at < b.created_at ? -1 : 1))
      .slice(0, limit);

    let confirmed = 0;
    for (const event of due) {
      const result = await this.anchor(event);
      if (result?.anchor_status === "confirmed") confirmed += 1;
    }
    return { attempted: due.length, confirmed, stillFailing: due.length - confirmed };
  }

  /** "Retry now" from the admin. In batch mode this runs the batch straight away for every waiting tip. */
  async retry(eventId: string) {
    if (this.mode === "batch") {
      await this.batches().run();
      const refreshed = await this.db.from("recognition_events").select("*").eq("id", eventId).single();
      if (refreshed.error) throw refreshed.error;
      return refreshed.data;
    }
    const event = await this.db.from("recognition_events").select("*").eq("id", eventId).single();
    if (event.error) throw event.error;
    return this.anchor(event.data);
  }
}
