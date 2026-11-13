import { randomBytes } from "node:crypto";

/**
 * UK GDPR data requests: access (a copy), delete (erasure) and correct.
 * People must get a reply within one month. Payment amounts and references are kept even after
 * erasure, because tax and accounting rules require them; personal details and notes are removed.
 */
export type RequesterType = "customer" | "staff" | "venue_owner" | "other";
export type RequestType = "access" | "delete" | "correct";

export interface DataRequestInput {
  requesterType: RequesterType;
  requestType: RequestType;
  email: string;
  name: string | null;
  venueName: string | null;
  tipDate: string | null;
  amountPence: number | null;
  details: string | null;
}

export type DataRequestErrors = Partial<Record<keyof DataRequestInput | "form", string>>;

const REQUESTERS: RequesterType[] = ["customer", "staff", "venue_owner", "other"];
const REQUESTS: RequestType[] = ["access", "delete", "correct"];

export function readDataRequest(formData: FormData): { input: DataRequestInput; errors: DataRequestErrors } {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const amount = text("amount") ? Math.round(Number(text("amount").replace(/[£,\s]/g, "")) * 100) : null;
  const input: DataRequestInput = {
    requesterType: text("requesterType") as RequesterType,
    requestType: text("requestType") as RequestType,
    email: text("email").toLowerCase(),
    name: text("name") || null,
    venueName: text("venueName") || null,
    tipDate: text("tipDate") || null,
    amountPence: amount !== null && Number.isFinite(amount) ? amount : null,
    details: text("details").slice(0, 2000) || null
  };
  const errors: DataRequestErrors = {};
  if (!REQUESTERS.includes(input.requesterType)) errors.requesterType = "Tell us who you are.";
  if (!REQUESTS.includes(input.requestType)) errors.requestType = "Choose what you'd like us to do.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = "Enter an email address we can reply to.";
  if (input.requesterType === "customer" && !input.venueName) errors.venueName = "Tell us where you left the tip so we can find it.";
  if (input.tipDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.tipDate)) errors.tipDate = "Enter a date.";
  if (input.requestType === "correct" && !input.details) errors.details = "Tell us what needs correcting.";
  return { input, errors };
}

/** One calendar month after the request arrives (the UK GDPR deadline). */
export function dueDate(received: Date) {
  const due = new Date(Date.UTC(received.getUTCFullYear(), received.getUTCMonth() + 1, received.getUTCDate()));
  // If next month is shorter (31 Jan -> 28 Feb), use its last day.
  if (due.getUTCDate() !== received.getUTCDate()) due.setUTCDate(0);
  return due.toISOString().slice(0, 10);
}

export function newReference() {
  return `DR-${randomBytes(4).toString("hex").toUpperCase()}`;
}

const FILLER = new Set(["and", "the", "cafe", "bar", "pub", "restaurant", "barbers", "barber", "co", "ltd"]);

/** Distinctive words in a venue name: "Juniper & Oak Café" -> juniper, oak. */
function venueWords(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !FILLER.has(word));
}

/** Tips a customer's request might refer to: a venue sharing a distinctive word, plus date and amount if given. */
export function matchCustomerTips(events: any[], request: { venue_name: string | null; tip_date: string | null; amount_pence: number | null }) {
  const wanted = new Set(venueWords(request.venue_name ?? ""));
  return events.filter((event) => {
    if (wanted.size > 0 && !venueWords(String(event.venues?.name ?? "")).some((word) => wanted.has(word))) return false;
    if (request.tip_date && String(event.created_at).slice(0, 10) !== request.tip_date) return false;
    if (request.amount_pence && event.amount_pence !== request.amount_pence) return false;
    return true;
  });
}

/** A readable copy of everything held about a staff member. */
export async function exportStaffData(db: any, workerIds: string[]) {
  if (workerIds.length === 0) return { staff_records: [], tips: [], dreams: [] };
  const [workers, tips, dreams] = await Promise.all([
    db.from("workers").select("id, display_name, role, photo_url, status, created_at, venues(name)").in("id", workerIds),
    db.from("recognition_events").select("id, created_at, amount_pence, currency, message, stripe_status, recognition_hash").in("worker_id", workerIds),
    db.from("worker_dreams").select("id, title, story, target_pence, funded_pence, status, created_at").in("worker_id", workerIds)
  ]);
  return { staff_records: workers.data ?? [], tips: tips.data ?? [], dreams: dreams.data ?? [] };
}

export async function exportTips(db: any, recognitionIds: string[]) {
  if (recognitionIds.length === 0) return { customer_tips: [] };
  const tips = await db
    .from("recognition_events")
    .select("id, created_at, amount_pence, currency, message, stripe_status, recognition_hash, venues(name), workers(display_name)")
    .in("id", recognitionIds);
  return { customer_tips: tips.data ?? [] };
}

/** Removes a tip's note. The amount and payment reference stay for accounting; the on-chain record is a hash only. */
export async function eraseTipNotes(db: any, recognitionIds: string[]) {
  for (const id of recognitionIds) await db.from("recognition_events").update({ message: null }).eq("id", id);
  return recognitionIds.length;
}

/**
 * Erases a staff member: anonymises their staff records, removes notes left to them and their dreams,
 * and (outside demo mode) deletes their sign-in. Tip amounts stay for payroll and tax records.
 */
export async function eraseStaff(db: any, workerIds: string[], deleteAuthUser: (() => Promise<void>) | null) {
  for (const id of workerIds) {
    await db.from("workers").update({ display_name: "Former staff member", role: "", photo_url: null, user_id: null, status: "inactive" }).eq("id", id);
    await db.from("recognition_events").update({ message: null }).eq("worker_id", id);
    await db.from("worker_dreams").update({ title: "Withdrawn", story: null, status: "withdrawn", show_on_wall: false }).eq("worker_id", id);
  }
  if (deleteAuthUser) await deleteAuthUser();
  return workerIds.length;
}
