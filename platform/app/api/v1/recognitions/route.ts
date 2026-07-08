import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PaymentService } from "@/lib/services/PaymentService";
import { protocolError, protocolResponse } from "@/lib/services/ProtocolApiService";
import { rateLimit } from "@/lib/services/rateLimit";

export async function GET() {
  const db = createServiceClient();
  const result = await db.from("recognition_events").select("*").order("created_at", { ascending: false }).limit(100);
  if (result.error) return protocolError(result.error.message, 500);
  return Response.json(protocolResponse(result.data));
}

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(key)) return protocolError("Too many requests", 429);

  const form = await request.formData();
  const amountPence = Number(form.get("amountPence"));
  const workerId = String(form.get("workerId"));
  const venueId = String(form.get("venueId"));
  const message = String(form.get("message") ?? "");

  const session = await new PaymentService().createCheckoutSession({ workerId, venueId, amountPence, message });
  if (!session.url) return protocolError("Stripe did not return a checkout URL", 500);
  return NextResponse.redirect(session.url, 303);
}
