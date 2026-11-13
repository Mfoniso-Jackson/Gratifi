import { adminApiAccess } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";
import { exportStaffData, exportTips } from "@/lib/services/DataRequestService";

/** A JSON copy of the selected staff records or tips, for answering a data access request. */
export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const access = await adminApiAccess({ globalOnly: true });
  if (access instanceof Response) return access;
  const { requestId } = await params;
  const db = createServiceClient();
  const dataRequest = (await db.from("data_requests").select("reference, email, requester_type").eq("id", requestId).maybeSingle()).data as any;
  if (!dataRequest) return Response.json({ error: "Request not found." }, { status: 404 });

  const query = new URL(request.url).searchParams;
  const body = {
    request: dataRequest.reference,
    prepared_for: dataRequest.email,
    prepared_at: new Date().toISOString(),
    note: "Card details are held by Stripe, not GratiFi. Each tip's permanent record on Moonbeam is a hash only.",
    ...(await exportStaffData(db, query.getAll("workerIds"))),
    ...(await exportTips(db, query.getAll("tipIds")))
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=gratifi-data-${dataRequest.reference}.json`
    }
  });
}
