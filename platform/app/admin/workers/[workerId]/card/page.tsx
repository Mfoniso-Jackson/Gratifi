import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/Shell";
import { CopyField } from "@/components/CopyField";
import { NfcSteps } from "@/components/NfcSteps";
import { canAccessVenue, requireAdmin } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";
import { QRService } from "@/lib/services/QRService";
import { countBySource } from "@/lib/services/ScanService";

export const dynamic = "force-dynamic";

/** A staff member's own tip card: a QR code to print and a link to write to an NFC badge. */
export default async function StaffCardPage({ params }: { params: Promise<{ workerId: string }> }) {
  const { workerId } = await params;
  const context = await requireAdmin();
  const db = createServiceClient();
  const worker = (await db.from("workers").select("*, venues(name)").eq("id", workerId).maybeSingle()).data as any;
  if (!worker || !canAccessVenue(context, worker.venue_id)) notFound();

  const qr = new QRService();
  const qrUrl = qr.workerUrl(worker.id, "qr");
  const nfcUrl = qr.workerUrl(worker.id, "nfc");
  const svg = await qr.toSvg(qrUrl);
  const visits = countBySource(((await db.from("qr_scans").select("source").eq("worker_id", worker.id)).data ?? []) as any[]);

  return (
    <AdminShell>
      <Link href="/admin/workers" className="text-sm text-ink/60 hover:text-ink">‹ Staff</Link>
      <h1 className="mt-2 text-3xl font-bold">{worker.display_name}&apos;s tip card</h1>
      <p className="mt-1 text-ink/70">
        {worker.role} at {worker.venues?.name}. Customers can scan the QR code or tap an NFC badge: both open {worker.display_name}&apos;s tip page.
      </p>
      <p className="mt-2 text-sm text-ink/60">
        So far: {visits.qr} QR scan{visits.qr === 1 ? "" : "s"} and {visits.nfc} NFC tap{visits.nfc === 1 ? "" : "s"}.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-semibold">QR code</h2>
          <p className="mt-1 text-sm text-ink/60">Print it on a card, badge or table sign.</p>
          <div className="mt-4 max-w-xs [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="mt-4"><CopyField value={qrUrl} label="QR link" /></div>
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-semibold">NFC badge</h2>
          <p className="mt-1 text-sm text-ink/60">Write this link to an NFC sticker, card or keyring. Customers hold their phone near it to tip.</p>
          <div className="mt-4"><CopyField value={nfcUrl} label="NFC link" /></div>
          <NfcSteps />
          <p className="mt-4 rounded-lg bg-[#f6f7f2] p-3 text-sm text-ink/70">
            Tip: put the QR code on the same badge. iPhones (XS and later) and most Android phones read NFC tags with no app,
            and the QR code covers everyone else.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
