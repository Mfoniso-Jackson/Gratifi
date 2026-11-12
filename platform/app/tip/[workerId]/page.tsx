import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, PublicShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { WorkerService } from "@/lib/services/WorkerService";
import { isQrVisit, recordScan } from "@/lib/services/ScanService";
import { DreamCard } from "@/components/DreamCard";
import { DreamTipForm } from "@/components/DreamTipForm";
import { getDemoDream } from "@/lib/demo/dreams";

export const dynamic = "force-dynamic";


export default async function TipPage({
  params,
  searchParams
}: {
  params: Promise<{ workerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workerId } = await params;
  const db = createServiceClient();
  const worker = await new WorkerService(db).get(workerId);
  if (worker.error || !worker.data) notFound();
  if (isQrVisit(await searchParams)) await recordScan(db, { venueId: worker.data.venue_id, workerId: worker.data.id });
  const venue = worker.data.venues;
  const dream = await getDemoDream(worker.data.id);

  return (
    <PublicShell minimal>
      <section className="mx-auto max-w-md px-5 pb-12 pt-4">
        {venue?.slug && (
          <Link href={`/v/${venue.slug}`} className="text-sm text-ink/60 hover:text-ink">
            ‹ {venue.name}
          </Link>
        )}
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={worker.data.display_name} photoUrl={worker.data.photo_url} size="h-16 w-16 text-2xl" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thank {worker.data.display_name}</h1>
            <p className="text-ink/60">{worker.data.role}</p>
          </div>
        </div>

        {dream && (
          <div className="mt-6">
            <DreamCard dream={dream} workerName={worker.data.display_name} />
          </div>
        )}

        <DreamTipForm
          workerId={worker.data.id}
          venueId={worker.data.venue_id}
          workerName={worker.data.display_name}
          dream={dream}
        />
      </section>
    </PublicShell>
  );
}
