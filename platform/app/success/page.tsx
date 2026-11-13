import Link from "next/link";
import { PublicShell } from "@/components/Shell";
import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { DreamCard } from "@/components/DreamCard";
import { getDream, recordSponsorView } from "@/lib/dreams/DreamService";
import { loadReceipt, type Receipt } from "@/lib/services/ReceiptService";
import { PaymentService } from "@/lib/services/PaymentService";

export const dynamic = "force-dynamic";

async function loadDemoEvent(eventId: string | undefined) {
  // Only demo mode looks up the event by id; live mode lands here from Stripe with a session id.
  if (!eventId || !isDemoMode()) return null;
  const result = await createServiceClient()
    .from("recognition_events")
    .select("*, workers(display_name), venues(name, slug, referral_code)")
    .eq("id", eventId)
    .maybeSingle();
  return result.data as any;
}

export default async function SuccessPage({
  searchParams
}: {
  searchParams: Promise<{ event?: string; dream?: string; match?: string; before?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const db = createServiceClient();
  const receipt: Receipt | null = isDemoMode()
    ? null
    : params.session_id
      ? await loadReceipt(db, params.session_id, (id) => new PaymentService().api().checkout.sessions.retrieve(id))
      : null;

  if (receipt?.state === "unpaid") {
    return (
      <PublicShell minimal>
        <section className="mx-auto grid min-h-[50vh] max-w-lg content-center gap-4 px-5 py-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Your payment didn&apos;t go through</h1>
          <p className="text-ink/70">Nothing was taken. You can try again.</p>
          {receipt.workerId && <Link href={`/tip/${receipt.workerId}`} className="mx-auto rounded-full bg-ink px-6 py-3 font-medium text-white">Try again</Link>}
        </section>
      </PublicShell>
    );
  }

  const event = receipt?.state === "recorded" || receipt?.state === "recording" ? receipt.event : await loadDemoEvent(params.event);
  const recording = receipt?.state === "recording";
  const dream = event ? await getDream(db, event.worker_id) : null;
  if (dream && event) await recordSponsorView(db, { campaignId: dream.campaign_id, venueId: event.venue_id, page: "thank_you" });

  // Demo checkout passes dream progress in the URL; live payments read it from the recorded contribution.
  const contribution = receipt?.state === "recorded" ? receipt.dreamContribution : null;
  const dreamLinked = params.dream === "1" || Boolean(contribution);
  const matchedPence = contribution
    ? contribution.match_pence
    : dreamLinked ? Math.max(0, Math.min(Number(params.match) || 0, event?.amount_pence ?? 0)) : 0;
  const beforePence = !dreamLinked || !dream
    ? undefined
    : contribution
      ? Math.max(0, dream.funded_pence - contribution.from_tip_pence - contribution.match_pence)
      : Math.max(0, Math.min(Number(params.before) || 0, dream.funded_pence));

  return (
    <PublicShell minimal>
      <section className="mx-auto grid min-h-[60vh] max-w-xl content-center px-5 py-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mint">
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#1f5c34" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-6 text-sm font-semibold text-coral">{recording ? "Payment received" : "Recognition complete"}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          {recording ? "Thank you. We're recording your recognition now." : "Thank you — your recognition has been permanently recorded."}
        </h1>

        {event && (
          <div className="mt-8 rounded-2xl border border-ink/10 bg-white p-5 text-left">
            <p className="text-lg font-semibold">
              £{(event.amount_pence / 100).toFixed(2)} to {event.workers?.display_name}
            </p>
            <p className="text-sm text-ink/60">{event.venues?.name}</p>
            {event.message && <p className="mt-3 rounded-xl bg-paper p-3 leading-7 text-ink/80">“{event.message}”</p>}
            <p className="mt-4 text-xs text-ink/50">Proof reference</p>
            <p className="break-all font-mono text-xs text-ink/70">{event.recognition_hash ?? "Being recorded. Refresh in a moment to see it."}</p>
          </div>
        )}

        {event && dream && (
          <div className="mt-4">
            <DreamCard
              dream={dream}
              workerName={event.workers?.display_name ?? "Their"}
              matchedPence={matchedPence}
              beforePence={beforePence}
            />
          </div>
        )}

        <Link
          href={event?.venues?.slug ? `/v/${event.venues.slug}` : "/"}
          className="mx-auto mt-8 rounded-full border border-ink/15 bg-white px-6 py-3 font-medium hover:border-ink/40"
        >
          Done
        </Link>

        <p className="mt-10 text-sm text-ink/60">
          Run a café, bar or salon?{" "}
          <Link
            href={event?.venues?.referral_code ? `/for-venues?ref=${event.venues.referral_code}` : "/for-venues"}
            className="font-medium text-ink underline underline-offset-4"
          >
            Get GratiFi for your venue
          </Link>
        </p>
      </section>
    </PublicShell>
  );
}
