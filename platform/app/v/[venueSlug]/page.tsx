import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, PublicShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { VenueService } from "@/lib/services/VenueService";
import { WorkerService } from "@/lib/services/WorkerService";
import { isQrVisit, recordScan } from "@/lib/services/ScanService";
import { loadVenueAccess } from "@/lib/billing/access";
import { PausedVenue } from "@/components/PausedVenue";
import { sponsorsEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function VenuePage({
  params,
  searchParams
}: {
  params: Promise<{ venueSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { venueSlug } = await params;
  const db = createServiceClient();
  const venue = await new VenueService(db).getBySlug(venueSlug);
  if (venue.error || !venue.data) notFound();
  if (isQrVisit(await searchParams)) await recordScan(db, { venueId: venue.data.id });
  if (!(await loadVenueAccess(db, venue.data)).takingTips) return <PausedVenue venueName={venue.data.name} />;
  const workers = await new WorkerService(db).listByVenue(venue.data.id);
  const team = workers.data ?? [];

  return (
    <PublicShell minimal>
      <section className="mx-auto max-w-2xl px-5 pb-12 pt-4">
        <p className="text-sm font-medium text-coral">Say thanks</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{venue.data.name}</h1>
        {venue.data.address && <p className="mt-1 text-ink/60">{venue.data.address}</p>}
        <p className="mt-6 text-lg text-ink/80">Who made your visit better?</p>

        <div className="mt-4 grid gap-3">
          {team.map((worker: any) => (
            <Link
              key={worker.id}
              href={`/tip/${worker.id}`}
              className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-ink/30 hover:shadow-sm"
            >
              <Avatar name={worker.display_name} photoUrl={worker.photo_url} />
              <div className="flex-1">
                <p className="text-lg font-semibold">{worker.display_name}</p>
                <p className="text-sm text-ink/60">{worker.role}</p>
              </div>
              <span className="text-2xl text-ink/30 transition group-hover:translate-x-1 group-hover:text-ink">›</span>
            </Link>
          ))}
          {team.length === 0 && (
            <p className="rounded-2xl border border-dashed border-ink/20 p-6 text-center text-ink/60">
              No team members are listed here yet.
            </p>
          )}
        </div>
        {sponsorsEnabled() && (
          <p className="mt-6 text-center text-sm">
            <Link href={`/dreams?venue=${venue.data.slug}`} className="font-medium underline underline-offset-4">See what this team is saving for</Link>
          </p>
        )}
        <p className="mt-8 text-center text-sm text-ink/50">No app or account needed · Payments secured by Stripe</p>
      </section>
    </PublicShell>
  );
}
