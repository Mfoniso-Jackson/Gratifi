import Link from "next/link";
import { PublicShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { VenueService } from "@/lib/services/VenueService";
import { WorkerService } from "@/lib/services/WorkerService";

export const dynamic = "force-dynamic";

export default async function VenuePage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const { venueSlug } = await params;
  const db = createServiceClient();
  const venue = await new VenueService(db).getBySlug(venueSlug);
  if (venue.error) throw new Error("Venue not found");
  const workers = await new WorkerService(db).listByVenue(venue.data.id);

  return (
    <PublicShell>
      <section className="mx-auto max-w-4xl px-5 py-10">
        <p className="text-sm text-ink/60">Choose who made your visit better</p>
        <h1 className="mt-2 text-4xl font-bold">{venue.data.name}</h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(workers.data ?? []).map((worker: any) => (
            <Link key={worker.id} href={`/tip/${worker.id}`} className="rounded-md border border-ink/10 bg-white p-5 hover:border-coral">
              <p className="text-xl font-semibold">{worker.display_name}</p>
              <p className="mt-1 text-ink/60">{worker.role}</p>
            </Link>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
