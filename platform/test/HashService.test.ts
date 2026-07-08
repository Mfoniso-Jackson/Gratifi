import { describe, expect, it } from "vitest";
import { HashService } from "@/lib/services/HashService";

describe("HashService", () => {
  it("generates deterministic recognition hashes", () => {
    const service = new HashService();
    const payload = {
      venueId: "550e8400-e29b-41d4-a716-446655440000",
      workerId: "550e8400-e29b-41d4-a716-446655440001",
      amountPence: 500,
      currency: "GBP" as const,
      message: "Thank you",
      stripePaymentIntentId: "pi_123",
      stripeStatus: "succeeded"
    };

    expect(service.recognitionHash(payload)).toEqual(service.recognitionHash({ ...payload }));
  });

  it("hashes blank messages consistently", () => {
    const service = new HashService();
    expect(service.messageHash(null)).toEqual(service.messageHash(""));
  });
});
