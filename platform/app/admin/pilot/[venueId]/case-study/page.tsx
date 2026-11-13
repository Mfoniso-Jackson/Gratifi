import { requireGlobalAdmin } from "@/lib/auth/access";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { caseStudyMarkdown, PilotService } from "@/lib/services/PilotService";

export const dynamic = "force-dynamic";

export default async function CaseStudyPage({ params }: { params: Promise<{ venueId: string }> }) {
  await requireGlobalAdmin();
  const { venueId } = await params;
  const profile = await new PilotService(createServiceClient()).getVenueProfile(venueId);
  const markdown = caseStudyMarkdown(profile);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">Grant-ready evidence</p>
          <h1 className="text-3xl font-bold">{profile.venue.name} case study</h1>
        </div>
        <a className="rounded-md border border-ink/15 bg-white px-4 py-2" href={`/api/admin/pilot/${profile.venue.id}/case-study`}>
          Export markdown
        </a>
      </div>
      <pre className="mt-6 whitespace-pre-wrap rounded-md border border-ink/10 bg-white p-5 text-sm leading-6">{markdown}</pre>
    </AdminShell>
  );
}
