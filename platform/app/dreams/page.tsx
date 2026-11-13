import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, PublicShell } from "@/components/Shell";
import { sponsorsEnabled } from "@/lib/features";
import { listWallDreams, recordSponsorView, type WallItem } from "@/lib/dreams/DreamService";
import { loadVenueAccess } from "@/lib/billing/access";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

function WallCard({ item }: { item: WallItem }) {
  const { dream, worker, venue } = item;
  const percent = Math.min(100, Math.round((dream.funded_pence / dream.target_pence) * 100));
  const done = dream.status === "funded";
  return (
    <article className="flex flex-col rounded-2xl border border-ink/10 bg-white p-5">
      <div className="flex items-center gap-3">
        <Avatar name={worker.display_name} photoUrl={worker.photo_url} size="h-11 w-11 text-base" />
        <div className="min-w-0">
          <p className="font-semibold">{worker.display_name}</p>
          <p className="truncate text-sm text-ink/60">{worker.role} · {venue.name}</p>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold leading-snug">{dream.title}</p>
      {dream.story && <p className="mt-1 text-sm leading-6 text-ink/70">&ldquo;{dream.story}&rdquo;</p>}
      <div className="mt-auto pt-4">
        <div className="h-2 overflow-hidden rounded-full bg-paper ring-1 ring-ink/10" aria-hidden="true">
          <div className={`h-full rounded-full ${done ? "bg-[#2f8a4c]" : "bg-coral"}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm tabular-nums text-ink/70">
          {done ? <span className="font-semibold text-[#1f5c34]">Dream complete</span> : <><span className="font-semibold text-ink">{pounds(dream.funded_pence)}</span> of {pounds(dream.target_pence)} · {percent}%</>}
        </p>
        {dream.sponsor_name && (
          <p className="mt-1 text-xs text-ink/50">
            <span className="rounded-full bg-paper px-1.5 py-0.5 ring-1 ring-ink/10">Sponsored</span> Backed by {dream.sponsor_name}
          </p>
        )}
        {!done && (
          <Link href={`/tip/${worker.id}`} className="mt-4 block rounded-full bg-ink px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-ink/85">
            Thank {worker.display_name}
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function DreamWallPage({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  if (!sponsorsEnabled()) notFound();
  const { venue: venueSlug } = await searchParams;
  const db = createServiceClient();
  const all = await listWallDreams(db, { isTakingTips: async (venue) => (await loadVenueAccess(db, venue)).takingTips });
  const items = venueSlug ? all.filter((item) => item.venue.slug === venueSlug) : all;
  const venues = [...new Map(all.map((item) => [item.venue.slug, item.venue])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const active = items.filter((item) => item.dream.status === "active");
  const done = items.filter((item) => item.dream.status === "funded");

  for (const item of items) {
    await recordSponsorView(db, { campaignId: item.dream.campaign_id, venueId: item.venue.id, page: "wall" });
  }

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-coral">Dream Wall</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">The people who serve you have dreams too</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-ink/70">
          Baristas, barbers and bar staff saving for something that matters. A thank-you can move them closer.
        </p>

        {venues.length > 1 && (
          <nav aria-label="Filter by venue" className="mt-8 flex flex-wrap gap-2 text-sm">
            <Link href="/dreams" className={`rounded-full px-3 py-1.5 ring-1 ring-ink/15 ${!venueSlug ? "bg-ink text-white" : "bg-white"}`}>All venues</Link>
            {venues.map((v) => (
              <Link key={v.slug} href={`/dreams?venue=${v.slug}`} className={`rounded-full px-3 py-1.5 ring-1 ring-ink/15 ${venueSlug === v.slug ? "bg-ink text-white" : "bg-white"}`}>
                {v.name}
              </Link>
            ))}
          </nav>
        )}

        {items.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-ink/20 p-10 text-center text-ink/60">No dreams on the wall yet.</p>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((item) => <WallCard key={item.dream.id} item={item} />)}
              </div>
            )}
            {done.length > 0 && (
              <>
                <h2 className="mt-12 text-2xl font-bold tracking-tight">Dreams that came true</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {done.map((item) => <WallCard key={item.dream.id} item={item} />)}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </PublicShell>
  );
}
