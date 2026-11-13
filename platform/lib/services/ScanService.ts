/** QR scan counting (see supabase/migrations/004_qr_scans.sql). */
export const QR_SOURCE_PARAM = "src";
export const QR_SOURCE_VALUE = "qr";

export function isQrVisit(searchParams: Record<string, string | string[] | undefined>) {
  return searchParams[QR_SOURCE_PARAM] === QR_SOURCE_VALUE;
}

/** Records a scan. Never throws: a failed count must not break the page a customer just opened. */
export async function recordScan(db: any, scan: { venueId: string; workerId?: string | null }) {
  try {
    await db.from("qr_scans").insert({ venue_id: scan.venueId, worker_id: scan.workerId ?? null });
  } catch (error) {
    console.error("Could not record QR scan:", error);
  }
}

/** Share of scans that led to a tip, as a whole percentage, or null when there were no scans. */
export function scanToTipRate(scans: number, tips: number) {
  if (scans <= 0) return null;
  return Math.min(100, Math.round((tips / scans) * 100));
}
