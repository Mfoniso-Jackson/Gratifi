import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/PaymentService";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = new PaymentService().verifyWebhook(rawBody, signature);
  } catch {
    // A bad or replayed signature is the sender's problem, not a server error.
    return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  const db = createServiceClient();
  const outcome = await handleStripeEvent(event, {
    db,
    createRecognition: (payload) => new RecognitionEngine(db).createFromPaidIntent(payload)
  });

  return Response.json({ received: true, outcome: outcome.action });
}
