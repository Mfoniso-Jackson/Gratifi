import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAccess, canAccessVenue } from "@/lib/auth/access";
import { venueCanUsePayroll } from "@/lib/billing/access";
import { isValidPeriod, payrollCsv, payrollRows } from "@/lib/services/PayrollService";

export async function GET(request: Request) {
  const context = await adminApiAccess();
  if (context instanceof Response) return context;

  const params = new URL(request.url).searchParams;
  const venueId = params.get("venueId") ?? "";
  const period = { from: params.get("from") ?? "", to: params.get("to") ?? "" };
  if (!isValidPeriod(period)) return Response.json({ error: "Give a valid from and to date (YYYY-MM-DD)." }, { status: 400 });
  if (!canAccessVenue(context, venueId)) return Response.json({ error: "Venue not found." }, { status: 404 });

  const db = createServiceClient();
  const venue = await db.from("venues").select("id, name, slug, created_at").eq("id", venueId).maybeSingle();
  if (!venue.data) return Response.json({ error: "Venue not found." }, { status: 404 });
  if (!(await venueCanUsePayroll(db, venue.data, context.role === "admin"))) {
    return Response.json({ error: "Payroll export is part of the Pro plan, or an add-on on Starter." }, { status: 402 });
  }

  const [workers, events] = await Promise.all([
    db.from("workers").select("*").eq("venue_id", venueId),
    db.from("recognition_events").select("*").eq("venue_id", venueId)
  ]);
  const rows = payrollRows(events.data ?? [], workers.data ?? [], period);

  return new Response(payrollCsv(rows, period, venue.data.name), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${venue.data.slug}-tips-${period.from}-to-${period.to}.csv`
    }
  });
}
