import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAccess } from "@/lib/auth/access";
import { campaignReport, reportCsv } from "@/lib/sponsors/SponsorService";

export async function GET(_: Request, { params }: { params: Promise<{ sponsorId: string }> }) {
  const access = await adminApiAccess({ globalOnly: true });
  if (access instanceof Response) return access;
  const { sponsorId } = await params;
  const db = createServiceClient();
  const sponsor = (await db.from("sponsors").select("*").eq("id", sponsorId).maybeSingle()).data as any;
  if (!sponsor) return Response.json({ error: "Sponsor not found." }, { status: 404 });
  const campaigns = ((await db.from("sponsor_campaigns").select("*").eq("sponsor_id", sponsorId)).data ?? []) as any[];
  const reports = await Promise.all(campaigns.map((c) => campaignReport(db, c)));
  const slug = String(sponsor.name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return new Response(reportCsv(sponsor.name, reports), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=${slug}-brand-report.csv` }
  });
}
