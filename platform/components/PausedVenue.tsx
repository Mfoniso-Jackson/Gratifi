import { PublicShell } from "@/components/Shell";

/** Shown to customers when a venue's pilot has ended without a plan. No tips can be left. */
export function PausedVenue({ venueName }: { venueName: string }) {
  return (
    <PublicShell minimal>
      <section className="mx-auto grid min-h-[50vh] max-w-lg content-center gap-3 px-5 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{venueName}</h1>
        <p className="text-ink/70">
          This venue isn&apos;t taking thank-yous through GratiFi right now. You can still thank the team in person.
        </p>
      </section>
    </PublicShell>
  );
}
