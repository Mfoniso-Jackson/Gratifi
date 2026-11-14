/**
 * Counting visits from GratiFi QR codes and NFC tags (see migrations 004 and 011).
 * QR codes link with ?src=qr and NFC tags with ?src=nfc; both open the same tip pages.
 */
export const QR_SOURCE_PARAM = "src";
export const QR_SOURCE_VALUE = "qr";
export const NFC_SOURCE_VALUE = "nfc";

export type VisitSource = "qr" | "nfc";

/** Where a visit came from, or null for a typed or shared link (not counted). */
export function visitSource(searchParams: Record<string, string | string[] | undefined>): VisitSource | null {
  const value = searchParams[QR_SOURCE_PARAM];
  return value === QR_SOURCE_VALUE || value === NFC_SOURCE_VALUE ? value : null;
}

export function isQrVisit(searchParams: Record<string, string | string[] | undefined>) {
  return visitSource(searchParams) === "qr";
}

/** Records a scan or tap. Never throws: a failed count must not break the page a customer just opened. */
export async function recordScan(db: any, scan: { venueId: string; workerId?: string | null; source?: VisitSource }) {
  try {
    await db.from("qr_scans").insert({ venue_id: scan.venueId, worker_id: scan.workerId ?? null, source: scan.source ?? "qr" });
  } catch (error) {
    console.error("Could not record scan:", error);
  }
}

/** Splits visits into QR scans and NFC taps (rows from before NFC count as QR). */
export function countBySource(rows: Array<{ source?: string | null }>) {
  const nfc = rows.filter((row) => row.source === "nfc").length;
  return { qr: rows.length - nfc, nfc, total: rows.length };
}

/** Share of scans that led to a tip, as a whole percentage, or null when there were no scans. */
export function scanToTipRate(scans: number, tips: number) {
  if (scans <= 0) return null;
  return Math.min(100, Math.round((tips / scans) * 100));
}
