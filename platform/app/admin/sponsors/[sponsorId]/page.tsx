import { notFound } from "next/navigation";
import { AdminShell, Stat } from "@/components/Shell";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";
import { campaignReport } from "@/lib/sponsors/SponsorService";
import { replaceLogo } from "../actions";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function SponsorReportPage({ params }: { params: Promise<{ sponsorId: string }> }) {
  await requireGlobalAdmin();
  const { sponsorId } = await params;
  const db = createServiceClient();
  const sponsor = (await db.from("sponsors").select("*").eq("id", sponsorId).maybeSingle()).data as any;
  if (!sponsor) notFound();
  const campaigns = ((await db.from("sponsor_campaigns").select("*").eq("sponsor_id", sponsorId)).data ?? []) as any[];
  const reports = await Promise.all(campaigns.map((c) => campaignReport(db, c)));

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {sponsor.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sponsor.logo_url} alt="" className="h-12 w-16 rounded object-contain" />
          )}
          <div>
            <p className="text-sm text-ink/60">Brand report</p>
            <h1 className="text-3xl font-bold">{sponsor.name}</h1>
          </div>
        </div>
        <a href={`/api/admin/sponsors/${sponsor.id}/report`} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">Download CSV</a>
      </div>

      {reports.length === 0 && <p className="mt-6 text-ink/70">No campaigns yet.</p>}
      {reports.map((r) => (
        <section key={r.campaign_id} className="mt-8">
          <h2 className="text-xl font-semibold">{r.campaign_name} <span className="text-sm font-normal text-ink/60">· {r.status} · {r.venues} venues</span></h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Times shown" value={String(r.views)} />
            <Stat label="Dream-linked tips" value={String(r.dream_linked_tips)} />
            <Stat label="Matched by the brand" value={pounds(r.brand_matched_pence)} />
            <Stat label="Given by customers" value={pounds(r.customer_to_dreams_pence)} />
            <Stat label="Fund left" value={`${pounds(r.fund_left_pence)} of ${pounds(r.fund_pence)}`} />
            <Stat label="Dreams" value={String(r.dreams)} />
            <Stat label="Dreams completed" value={String(r.dreams_completed)} />
            <Stat label="Staff reached" value={String(r.staff_reached)} />
          </div>
        </section>
      ))}
      <p className="mt-6 text-sm text-ink/60">Counts only. Individual staff tips and notes are never shared with sponsors.</p>

      <form action={replaceLogo} className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4">
        <input type="hidden" name="sponsorId" value={sponsor.id} />
        <label className="grid gap-1 text-sm">Replace logo (PNG, JPEG or WebP, max 500 KB)
          <input id="replace-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
        </label>
        <button className="rounded-md border border-ink/15 px-4 py-2">Upload</button>
      </form>
    </AdminShell>
  );
}
