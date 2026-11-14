import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { QRService } from "@/lib/services/QRService";
import { CopyField } from "@/components/CopyField";
import { NfcSteps } from "@/components/NfcSteps";
import { canAccessVenue, requireAdmin } from "@/lib/auth/access";
import { appConfig } from "@/lib/config";
import { referralLink } from "@/lib/services/SignupService";
import { loadVenueAccess } from "@/lib/billing/access";
import { revalidatePath } from "next/cache";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { sponsorsEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

async function setBillingExempt(formData: FormData) {
  "use server";
  await requireGlobalAdmin();
  const venueId = String(formData.get("venueId"));
  await createServiceClient().from("venues").update({ billing_exempt: formData.get("exempt") === "on" }).eq("id", venueId);
  revalidatePath(`/admin/venues/${venueId}`);
}

/** Venue owners can block any sponsor from appearing at their venue (for example a rival brand). */
async function setSponsorBlock(formData: FormData) {
  "use server";
  const context = await requireAdmin();
  const venueId = String(formData.get("venueId"));
  const sponsorId = String(formData.get("sponsorId"));
  if (!canAccessVenue(context, venueId)) throw new Error("Venue not found.");
  const db = createServiceClient();
  if (formData.get("block") === "true") {
    await db.from("venue_sponsor_blocks").upsert({ venue_id: venueId, sponsor_id: sponsorId }, { onConflict: "venue_id,sponsor_id" });
  } else {
    await db.from("venue_sponsor_blocks").delete().eq("venue_id", venueId).eq("sponsor_id", sponsorId);
  }
  revalidatePath(`/admin/venues/${venueId}`);
}

const STATE_TEXT = {
  pilot: (days: number) => `Free pilot · ${days} day${days === 1 ? "" : "s"} left · Choose a plan`,
  grace: (days: number) => `Pilot ended · ${days} day${days === 1 ? "" : "s"} to choose a plan`,
  paused: () => "Not taking tips · Choose a plan to restart",
  paid: () => "Plan and billing"
};

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
  const access = await loadVenueAccess(db, venue.data);
  const showSponsors = sponsorsEnabled();
  const sponsors = showSponsors ? (((await db.from("sponsors").select("*").eq("status", "active").order("name")).data ?? []) as any[]) : [];
  const blocked = new Set(
    showSponsors ? (((await db.from("venue_sponsor_blocks").select("sponsor_id").eq("venue_id", venue.data.id)).data ?? []) as any[]).map((b) => b.sponsor_id) : []
  );
  const campaignsHere = showSponsors
    ? (((await db.from("campaign_venues").select("*, sponsor_campaigns(sponsor_id, status)").eq("venue_id", venue.data.id)).data ?? []) as any[])
    : [];
  const runningHere = new Set(campaignsHere.filter((c) => c.sponsor_campaigns?.status === "live").map((c) => c.sponsor_campaigns?.sponsor_id));

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
          {venue.data.billing_exempt ? "Not billed (comped by GratiFi)" : STATE_TEXT[access.state](access.daysLeft)} ›
        </Link>
      </div>
      {context.role === "admin" && (
        <form action={setBillingExempt} className="mt-4 flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm">
          <input type="hidden" name="venueId" value={venue.data.id} />
          <label className="flex items-center gap-2">
            <input id="exempt" type="checkbox" name="exempt" defaultChecked={Boolean(venue.data.billing_exempt)} />
            Don&apos;t bill this venue (it never pauses)
          </label>
          <button className="rounded-md border border-ink/15 px-3 py-1">Save</button>
        </form>
      )}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-white p-5">
          <p className="text-sm text-ink/60">Venue QR</p>
          <div className="mt-4 max-w-xs [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="grid content-start gap-6">
          <div className="rounded-md border border-ink/10 bg-white p-5">
            <p className="font-semibold">Print card URL</p>
            <p className="mt-2 break-all text-sm text-ink/70">{qr.venueUrl(venue.data.slug)}</p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white p-5">
            <p className="font-semibold">NFC tap point</p>
            <p className="mt-1 text-sm text-ink/70">
              Write this link to an NFC sticker for the counter or tables. Customers tap their phone to choose who to thank.
              Each staff member can also have their own badge from the <Link href="/admin/workers" className="underline">Staff</Link> page.
            </p>
            <div className="mt-3"><CopyField value={qr.venueUrl(venue.data.slug, "nfc")} label="NFC link" /></div>
            <NfcSteps />
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
      {showSponsors && sponsors.length > 0 && (
        <section className="mt-6 rounded-md border border-ink/10 bg-white p-5">
          <p className="font-semibold">Sponsors at this venue</p>
          <p className="mt-1 text-sm text-ink/70">
            Brands can back your staff&apos;s dreams. Block any you don&apos;t want here, for example a rival to something you stock.
          </p>
          <div className="mt-3 divide-y divide-ink/10">
            {sponsors.map((sponsor) => {
              const isBlocked = blocked.has(sponsor.id);
              return (
                <form key={sponsor.id} action={setSponsorBlock} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <input type="hidden" name="venueId" value={venue.data.id} />
                  <input type="hidden" name="sponsorId" value={sponsor.id} />
                  <input type="hidden" name="block" value={isBlocked ? "false" : "true"} />
                  <div className="text-sm">
                    <span className="font-medium">{sponsor.name}</span>
                    <span className="text-ink/60">
                      {isBlocked ? " · Blocked" : runningHere.has(sponsor.id) ? " · Running here now" : " · Allowed"}
                    </span>
                  </div>
                  <button className={`rounded-md px-3 py-1.5 text-sm ${isBlocked ? "border border-ink/15" : "bg-ink text-white"}`}>
                    {isBlocked ? "Allow" : "Block"}
                  </button>
                </form>
              );
            })}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
