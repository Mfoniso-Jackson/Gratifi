import Link from "next/link";
import { Avatar, PublicShell, Stat } from "@/components/Shell";
import { requireStaff } from "@/lib/auth/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { isCounted, staffSummary } from "@/lib/services/StaffService";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toFixed(2)}`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default async function StaffPage() {
  const workers = await requireStaff();

  if (workers.length === 0) {
    return (
      <PublicShell minimal>
        <section className="mx-auto max-w-xl px-5 py-10">
          <h1 className="text-3xl font-bold tracking-tight">Nearly there</h1>
          <p className="mt-3 text-ink/70">
            You&apos;re signed in, but your account isn&apos;t linked to a venue yet. Ask your manager to invite you from the
            Staff page of their GratiFi dashboard, using this email address.
          </p>
        </section>
      </PublicShell>
    );
  }

  const db = createServiceClient();
  const ids = workers.map((w) => w.id);
  const events = (((await db.from("recognition_events").select("*").in("worker_id", ids)).data ?? []) as any[]).sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1
  );
  const summary = staffSummary(events);
  const me = workers.at(0);
  const venueNames = workers.map((w) => w.venues?.name).filter(Boolean).join(" and ");

  return (
    <PublicShell minimal>
      <section className="mx-auto max-w-3xl px-5 pb-12 pt-2">
        <div className="flex items-center gap-4">
          <Avatar name={me.display_name} photoUrl={me.photo_url} size="h-14 w-14 text-xl" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Hi {me.display_name}</h1>
            <p className="text-ink/60">{venueNames}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Stat label="This month" value={pounds(summary.thisMonthPence)} />
          <Stat label="All time" value={pounds(summary.allTimePence)} />
          <Stat label="Thank-yous" value={String(summary.thankYous)} />
        </div>

        <h2 className="mt-10 text-xl font-semibold">What customers said</h2>
        <div className="mt-3 grid gap-3">
          {events.length === 0 && (
            <p className="rounded-xl border border-dashed border-ink/20 p-6 text-center text-ink/60">
              No thank-yous yet. They&apos;ll appear here as soon as a customer scans your QR card.
            </p>
          )}
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-ink/10 bg-white p-4">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold tabular-nums">{pounds(event.amount_pence)}</span>
                <span className="text-ink/50">
                  {day(event.created_at)}
                  {!isCounted(event) && <span className="ml-2 rounded-full bg-paper px-2 py-0.5 ring-1 ring-ink/10">{String(event.stripe_status).replaceAll("_", " ")}</span>}
                </span>
              </div>
              <p className="mt-1 leading-7 text-ink/80">{event.message ? `“${event.message}”` : <span className="text-ink/40">No note</span>}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink/50">
          Tips are paid by your venue, usually with your wages. Questions about payments go to your manager.{" "}
          <Link href="/" className="underline">GratiFi</Link>
        </p>
      </section>
    </PublicShell>
  );
}
