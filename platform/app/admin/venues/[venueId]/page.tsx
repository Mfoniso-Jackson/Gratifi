import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { QRService } from "@/lib/services/QRService";

export const dynamic = "force-dynamic";

export default async function VenueAdminPage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const db = createServiceClient();
  const venue = await db.from("venues").select("*").eq("id", venueId).single();
  if (venue.error) throw new Error("Venue not found");
  const qr = new QRService();
  const svg = await qr.toSvg(qr.venueUrl(venue.data.slug));

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">{venue.data.name}</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-ink/10 bg-white p-5">
          <p className="text-sm text-ink/60">Venue QR</p>
          <div className="mt-4 max-w-xs" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-5">
          <p className="font-semibold">Print card URL</p>
          <p className="mt-2 break-all text-sm text-ink/70">{qr.venueUrl(venue.data.slug)}</p>
        </div>
      </div>
    </AdminShell>
  );
}
