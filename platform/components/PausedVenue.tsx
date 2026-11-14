import { PublicShell } from "@/components/Shell";

/**
 * Shown to customers when a venue can't take tips: its pilot ended without a plan ("paused"), or it
 * hasn't finished setting up payouts with Stripe yet ("setting_up").
 */
export function PausedVenue({ venueName, reason = "paused" }: { venueName: string; reason?: "paused" | "setting_up" }) {
  return (
    <PublicShell minimal>
      <section className="mx-auto grid min-h-[50vh] max-w-lg content-center gap-3 px-5 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{venueName}</h1>
        <p className="text-ink/70">
          {reason === "setting_up"
            ? "This venue is still setting up GratiFi, so card thank-yous aren't open yet. Please check back soon, or thank the team in person."
            : "This venue isn't taking thank-yous through GratiFi right now. You can still thank the team in person."}
        </p>
      </section>
    </PublicShell>
  );
}
