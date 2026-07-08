import { ethers } from "ethers";
import { protocolVersion } from "@/lib/config";
import type { RecognitionPayload } from "@/lib/types/domain";

export class HashService {
  messageHash(message?: string | null) {
    return ethers.keccak256(ethers.toUtf8Bytes((message ?? "").trim()));
  }

  entityHash(id: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(id));
  }

  recognitionHash(payload: RecognitionPayload) {
    const normalized = this.normalizeRecognition(payload);
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(normalized)));
  }

  normalizeRecognition(payload: RecognitionPayload) {
    return {
      protocolVersion,
      venueId: payload.venueId,
      workerId: payload.workerId,
      amountPence: payload.amountPence,
      currency: payload.currency,
      messageHash: this.messageHash(payload.message),
      stripePaymentIntentId: payload.stripePaymentIntentId
    };
  }
}
