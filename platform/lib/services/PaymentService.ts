import Stripe from "stripe";
import { appConfig } from "@/lib/config";

export class PaymentService {
  private stripe: Stripe;

  constructor(stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")) {
    this.stripe = stripe;
  }

  async createCheckoutSession(input: {
    workerId: string;
    venueId: string;
    amountPence: number;
    message?: string | null;
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
        message: input.message ?? ""
      },
      success_url: `${appConfig.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appConfig.appUrl}/tip/${input.workerId}`
    });
  }

  verifyWebhook(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
