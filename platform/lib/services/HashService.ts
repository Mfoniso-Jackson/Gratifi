import { ethers } from "ethers";
import { protocolVersion } from "@/lib/config";
import type { RecognitionPayload } from "@/lib/types/domain";

/**
 * Fingerprints for the permanent record (see docs/protocol/hashing-standard.md).
 *
 * Every tip gets its own random 32-byte salt, stored only in a server-only table (recognition_salts,
 * migration 014). It is mixed into the
 * note, venue and staff hashes, so:
 * - a short note such as "Thanks!" can't be matched to its on-chain hash by guessing;
 * - a staff member's tips can't be linked together on-chain from their public tip-page ID;
 * - deleting the salt (on an erasure request) unlinks the on-chain fingerprint for good.
 */
export class HashService {
  /** A fresh random salt for one tip, as 0x-prefixed hex. */
  newSalt() {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /** keccak256(salt || utf8(trimmed message)); without a salt, the unsalted v1 form. */
  messageHash(message?: string | null, salt?: string | null) {
    return ethers.keccak256(this.withSalt(salt, (message ?? "").trim()));
  }

  /** keccak256(salt || utf8(id)); without a salt, the unsalted v1 form. */
  entityHash(id: string, salt?: string | null) {
    return ethers.keccak256(this.withSalt(salt, id));
  }

  recognitionHash(payload: RecognitionPayload, salt?: string | null) {
    const normalized = this.normalizeRecognition(payload, salt);
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(normalized)));
  }

  normalizeRecognition(payload: RecognitionPayload, salt?: string | null) {
    return {
      protocolVersion,
      venueId: payload.venueId,
      workerId: payload.workerId,
      amountPence: payload.amountPence,
      currency: payload.currency,
      messageHash: this.messageHash(payload.message, salt),
      stripePaymentIntentId: payload.stripePaymentIntentId,
      ...(salt ? { salt } : {})
    };
  }

  private withSalt(salt: string | null | undefined, text: string) {
    const bytes = ethers.toUtf8Bytes(text);
    return salt ? ethers.concat([ethers.getBytes(salt), bytes]) : bytes;
  }
}
