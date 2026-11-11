import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/PaymentService";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";
import { clientKey, rateLimit } from "@/lib/services/rateLimit";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { isDemoMode } from "@/lib/demo/mode";
import { applyDemoDreamTip } from "@/lib/demo/dreams";

export async function GET() {
  const db = createServiceClient();
  const result = await db.from("recognition_events").select("*").order("created_at", { ascending: false }).limit(100);
  if (result.error) return protocolError(result.error.message, 500);
  return Response.json(protocolResponse(result.data));
}

export async function POST(request: Request) {
  if (!(await rateLimit(`checkout:${clientKey(request.headers)}`))) return protocolError("Too many requests", 429);

  const form = await request.formData();
  const amountPence = Number(form.get("amountPence"));
  const workerId = String(form.get("workerId"));
  const venueId = String(form.get("venueId"));
  const message = String(form.get("message") ?? "");

  if (isDemoMode()) {
    // Demo mode skips Stripe Checkout and records the recognition as if payment had settled.
    const event = await new RecognitionEngine(createServiceClient()).createFromPaidIntent({
      workerId,
      venueId,
      amountPence,
      currency: "GBP",
      message,
      stripePaymentIntentId: `pi_demo_${crypto.randomUUID()}`,
      stripeStatus: "paid"
    });
    const dreamTip = form.get("dreamLinked") === "on" ? await applyDemoDreamTip(workerId, amountPence) : null;
    const query = dreamTip
      ? `event=${event.id}&dream=1&match=${dreamTip.match}&before=${dreamTip.before}`
      : `event=${event.id}`;
    return NextResponse.redirect(new URL(`/success?${query}`, request.url), 303);
  }

  const session = await new PaymentService().createCheckoutSession({ workerId, venueId, amountPence, message });
  if (!session.url) return protocolError("Stripe did not return a checkout URL", 500);
  return NextResponse.redirect(session.url, 303);
}
