import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { appVenueUrl, PilotService } from "@/lib/services/PilotService";

export const dynamic = "force-dynamic";

export default async function StaffScriptPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const venue = await new PilotService(createServiceClient()).getVenue(venueId);

  return (
    <AdminShell>
      <div className="print:hidden">
        <p className="text-sm text-ink/60">Printable staff prompt</p>
        <h1 className="text-3xl font-bold">{venue.name} staff script</h1>
      </div>
      <section className="mt-6 rounded-md border border-ink/10 bg-white p-8 print:border-0">
        <p className="text-sm uppercase tracking-wide text-ink/50">Suggested line</p>
        <p className="mt-4 text-3xl font-semibold leading-snug">
          “If you enjoyed the service, there’s a thank-you QR on the counter.”
        </p>
        <div className="mt-8 grid gap-4 text-sm text-ink/70">
          <p>Keep it casual. Mention it only after a positive moment or at checkout.</p>
          <p>Do not explain payments, wallets, or blockchain. The customer only needs to know they can leave a thank-you.</p>
          <p className="break-all">Venue page: {appVenueUrl(venue.slug)}</p>
        </div>
      </section>
    </AdminShell>
  );
}
