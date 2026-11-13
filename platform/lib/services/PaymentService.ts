import Stripe from "stripe";
import { appConfig } from "@/lib/config";

export class PaymentService {
  private client: Stripe | undefined;

  constructor(stripe?: Stripe) {
    this.client = stripe;
  }

  /** Created on first use, so checking a webhook signature doesn't need the API key. */
  private get stripe(): Stripe {
    this.client ??= new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    return this.client;
  }

  async createCheckoutSession(input: {
    workerId: string;
    venueId: string;
    amountPence: number;
    message?: string | null;
    dreamLinked?: boolean;
  }) {
    if (input.amountPence < appConfig.minTipAmountPence || input.amountPence > appConfig.maxTipAmountPence) {
      throw new Error("Amount is outside configured recognition limits.");
    }

    return this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: input.amountPence,
            product_data: { name: "Recognition" }
          }
        }
      ],
      metadata: {
        workerId: input.workerId,
        venueId: input.venueId,
        message: input.message ?? "",
        dreamLinked: input.dreamLinked ? "true" : "false"
      },
      success_url: `${appConfig.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appConfig.appUrl}/tip/${input.workerId}`
    });
  }

  /** The Stripe client for other server code (billing). Throws a clear error when no API key is set. */
  api(): Stripe {
    if (!this.client && !process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured.");
    return this.stripe;
  }

  verifyWebhook(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    // Signature checks only need the webhook secret; the placeholder key is never used for API calls.
    const verifier = this.client ?? new Stripe(process.env.STRIPE_SECRET_KEY || "sk_webhook_verification_only");
    return verifier.webhooks.constructEvent(payload, signature, secret);
  }
}
