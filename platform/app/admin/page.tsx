import Link from "next/link";
import { AdminShell, Avatar, Stat } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin, scopeToVenues } from "@/lib/auth/access";
import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";
import { countBySource, scanToTipRate } from "@/lib/services/ScanService";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const context = await requireAdmin();
  const db = createServiceClient();
  const events = await scopeToVenues(
    db.from("recognition_events").select("*, workers(display_name), venues(name)"),
    context
  ).order("created_at", { ascending: false });
  const rows: any[] = events.data ?? [];
  // Refunded and disputed tips stay listed but no longer count toward the total.
  const total = rows
    .filter((event) => !REVERSED_STRIPE_STATUSES.includes(event.stripe_status))
    .reduce((sum, event) => sum + event.amount_pence, 0);
  const recentMessages = rows.filter((event) => event.message).slice(0, 5);

  // Scans and tips over the last 30 days, for the scan-to-tip rate.
  const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const scanResult = await scopeToVenues(db.from("qr_scans").select("created_at, source"), context);
  const visits30 = countBySource((scanResult.data ?? []).filter((scan: { created_at: string }) => scan.created_at >= since));
  const scans30 = visits30.total;
  const tips30 = rows.filter((event) => event.created_at >= since).length;
  const rate = scanToTipRate(scans30, tips30);

  // How often customers ticked "cover the card fee", over the same 30 days.
  const counted30 = rows.filter((event) => event.created_at >= since && !REVERSED_STRIPE_STATUSES.includes(event.stripe_status));
  const feeCovered30 = counted30.filter((event) => (event.fee_covered_pence ?? 0) > 0);
  const feePence30 = feeCovered30.reduce((sum, event) => sum + (event.fee_covered_pence ?? 0), 0);
  const feeRate = counted30.length ? Math.round((feeCovered30.length / counted30.length) * 100) : null;

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Recognitions" value={String(rows.length)} />
        <Stat label="Total" value={`£${(total / 100).toFixed(2)}`} />
        <Stat label="Pending anchoring" value={String(rows.filter((e) => e.anchor_status !== "confirmed").length)} />
        <Stat label="Scans and taps (30 days)" value={`${scans30}${visits30.nfc ? ` · ${visits30.nfc} NFC` : ""}`} />
        <Stat label="Scans that led to a tip" value={rate === null ? "No scans yet" : `${rate}%`} />
      </div>
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-4 text-sm">
        <span className="font-semibold">Card fees covered by customers (30 days): </span>
        {feeRate === null
          ? "No tips yet."
          : `${feeCovered30.length} of ${counted30.length} tips (${feeRate}%), £${(feePence30 / 100).toFixed(2)} in card fees paid by customers.`}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Latest thank-you notes</h2>
        <Link href="/admin/events" className="text-sm text-ink/60 hover:text-ink">All events ›</Link>
      </div>
      <div className="mt-3 grid gap-3">
        {recentMessages.map((event) => (
          <div key={event.id} className="flex gap-4 rounded-xl border border-ink/10 bg-white p-4">
            <Avatar name={event.workers?.display_name ?? "?"} size="h-10 w-10 text-base" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink/60">
                <span className="font-semibold text-ink">{event.workers?.display_name}</span> · {event.venues?.name} · £
                {(event.amount_pence / 100).toFixed(2)}
              </p>
              <p className="mt-1 leading-7">“{event.message}”</p>
            </div>
            <p className="hidden shrink-0 text-sm text-ink/40 sm:block">{new Date(event.created_at).toLocaleDateString("en-GB")}</p>
          </div>
        ))}
        {recentMessages.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink/20 p-6 text-center text-ink/60">No thank-you notes yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
