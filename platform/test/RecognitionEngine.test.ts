import { describe, expect, it } from "vitest";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";

describe("RecognitionEngine", () => {
  it("rejects unsettled payments", async () => {
    const engine = new RecognitionEngine({});
    await expect(
      engine.createFromPaidIntent({
        venueId: "550e8400-e29b-41d4-a716-446655440000",
        workerId: "550e8400-e29b-41d4-a716-446655440001",
        amountPence: 500,
        currency: "GBP",
        message: null,
        stripePaymentIntentId: "pi_123",
        stripeStatus: "requires_payment_method"
      })
    ).rejects.toThrow("Payment is not settled.");
  });
});
