import { z } from "zod";
import { appConfig, protocolVersion } from "@/lib/config";
import { HashService } from "@/lib/services/HashService";
import { MoonbeamService } from "@/lib/services/MoonbeamService";
import type { RecognitionPayload } from "@/lib/types/domain";

const RecognitionSchema = z.object({
  venueId: z.string().uuid(),
  workerId: z.string().uuid(),
  amountPence: z.number().int().positive(),
  currency: z.literal("GBP"),
  message: z.string().trim().max(280).optional().nullable(),
  stripePaymentIntentId: z.string().min(3),
  stripeStatus: z.string().min(2)
});

export class RecognitionEngine {
  constructor(
    private readonly db: any,
    private readonly hashService = new HashService(),
    private readonly moonbeamService = new MoonbeamService()
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
        moonbeam_status: "pending",
        moonbeam_contract_address: appConfig.moonbeam.contractAddress || null,
        protocol_version: protocolVersion
      })
      .select("*")
      .single();

    if (insert.error) throw insert.error;
    return this.anchor(insert.data);
  }

  async anchor(event: any) {
    try {
      const result = await this.moonbeamService.recordRecognition({
        recognitionHash: event.recognition_hash,
        venueHash: this.hashService.entityHash(event.venue_id),
        workerHash: this.hashService.entityHash(event.worker_id),
        messageHash: event.message_hash,
        amountPence: event.amount_pence
      });

      const update = await this.db
        .from("recognition_events")
        .update({
          moonbeam_status: "confirmed",
          moonbeam_tx_hash: result.txHash,
          moonbeam_block_number: result.blockNumber,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", event.id)
        .select("*")
        .single();

      if (update.error) throw update.error;
      return update.data;
    } catch (error) {
      await this.db.from("recognition_events").update({ moonbeam_status: "retry" }).eq("id", event.id);
      return { ...event, moonbeam_status: "retry" };
    }
  }

  async retry(eventId: string) {
    const event = await this.db.from("recognition_events").select("*").eq("id", eventId).single();
    if (event.error) throw event.error;
    return this.anchor(event.data);
  }
}
