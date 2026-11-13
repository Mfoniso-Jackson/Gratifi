import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { QRService } from "@/lib/services/QRService";
import { canAccessVenue, requireAdmin } from "@/lib/auth/access";
import { appConfig } from "@/lib/config";
import { referralLink } from "@/lib/services/SignupService";
import { pilotDaysLeft } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

export default async function VenueAdminPage({
  params,
  searchParams
}: {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { venueId } = await params;
  const { welcome } = await searchParams;
  const context = await requireAdmin();
  if (!canAccessVenue(context, venueId)) notFound();
  const db = createServiceClient();
  const venue = await db.from("venues").select("*").eq("id", venueId).single();
  if (venue.error || !venue.data) notFound();
  const qr = new QRService();
  const svg = await qr.toSvg(qr.venueUrl(venue.data.slug));
  const code: string | null = venue.data.referral_code ?? null;
  const referred = code ? ((await db.from("venues").select("id, name").eq("referred_by_code", code)).data ?? []) : [];
  const daysLeft = pilotDaysLeft(venue.data.created_at);

  return (
    <AdminShell>
      {welcome && (
        <div className="mb-6 rounded-xl border border-ink/10 bg-mint p-5 text-[#1f5c34]">
          <p className="font-semibold">Welcome to GratiFi. Your 30-day pilot has started.</p>
          <p className="mt-1 text-sm">
            Next: <Link href="/admin/workers" className="underline">add your team</Link>, then print the QR card below.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-bold">{venue.data.name}</h1>
        <Link href={`/admin/billing?venueId=${venue.data.id}`} className="text-sm text-ink/60 hover:text-ink">
          {daysLeft > 0 ? `${daysLeft} days left in your pilot · Choose a plan` : "Plan and billing"} ›
        </Link>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-white p-5">
          <p className="text-sm text-ink/60">Venue QR</p>
          <div className="mt-4 max-w-xs" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="grid content-start gap-6">
          <div className="rounded-md border border-ink/10 bg-white p-5">
            <p className="font-semibold">Print card URL</p>
            <p className="mt-2 break-all text-sm text-ink/70">{qr.venueUrl(venue.data.slug)}</p>
          </div>
          {code && (
            <div className="rounded-md border border-ink/10 bg-white p-5">
              <p className="font-semibold">Refer another venue</p>
              <p className="mt-1 text-sm text-ink/70">Share this link. Venues that sign up through it are credited to you.</p>
              <p className="mt-3 break-all rounded-md bg-[#f6f7f2] px-3 py-2 font-mono text-sm">{referralLink(appConfig.appUrl, code)}</p>
              <p className="mt-3 text-sm text-ink/70">
                {referred.length === 0
                  ? "No referrals yet."
                  : `${referred.length} venue${referred.length === 1 ? "" : "s"} joined through you: ${referred.map((v: any) => v.name).join(", ")}.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
