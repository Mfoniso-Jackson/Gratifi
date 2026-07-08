import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/PaymentService";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });

  const rawBody = await request.text();
  const event = new PaymentService().verifyWebhook(rawBody, signature);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

    if (paymentIntentId && session.metadata?.venueId && session.metadata?.workerId && session.amount_total) {
      await new RecognitionEngine(createServiceClient()).createFromPaidIntent({
        venueId: session.metadata.venueId,
        workerId: session.metadata.workerId,
        amountPence: session.amount_total,
        currency: "GBP",
        message: session.metadata.message,
        stripePaymentIntentId: paymentIntentId,
        stripeStatus: session.payment_status
      });
    }
  }

  return Response.json({ received: true });
}
