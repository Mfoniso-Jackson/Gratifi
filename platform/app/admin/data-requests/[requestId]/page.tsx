import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/Shell";
import { StatusPill } from "@/components/StatusPill";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { findUserIdByEmail } from "@/lib/supabase/authUsers";
import { eraseStaff, eraseTipNotes, matchCustomerTips } from "@/lib/services/DataRequestService";

export const dynamic = "force-dynamic";

async function loadRequest(requestId: string) {
  const db = createServiceClient();
  const request = (await db.from("data_requests").select("*").eq("id", requestId).maybeSingle()).data as any;
  return { db, request };
}

/** Staff linked to the requester's sign-in (live mode only; demo mode has no accounts). */
async function linkedWorkers(db: any, email: string) {
  if (isDemoMode()) return [];
  const userId = await findUserIdByEmail(db, email).catch(() => null);
  if (!userId) return [];
  return ((await db.from("workers").select("id").eq("user_id", userId)).data ?? []).map((w: any) => w.id as string);
}

function appendNote(existing: string | null, line: string) {
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  return [existing, `${stamp} ${line}`].filter(Boolean).join("\n");
}

async function eraseSelected(formData: FormData) {
  "use server";
  await requireGlobalAdmin();
  if (formData.get("confirmed") !== "on") throw new Error("Confirm you've checked who the person is first.");
  const { db, request } = await loadRequest(String(formData.get("requestId")));
  if (!request) throw new Error("Request not found.");
  const workerIds = formData.getAll("workerIds").map(String);
  const tipIds = formData.getAll("tipIds").map(String);

  let staffErased = 0;
  if (workerIds.length) {
    const userId = isDemoMode() ? null : await findUserIdByEmail(db, request.email).catch(() => null);
    staffErased = await eraseStaff(db, workerIds, userId ? async () => { await (db as any).auth.admin.deleteUser(userId); } : null);
  }
  const notesErased = await eraseTipNotes(db, tipIds);
  await db
    .from("data_requests")
    .update({ status: "in_progress", admin_note: appendNote(request.admin_note, `Erased ${staffErased} staff record(s) and ${notesErased} tip note(s).`) })
    .eq("id", request.id);
  revalidatePath(`/admin/data-requests/${request.id}`);
}

async function setStatus(formData: FormData) {
  "use server";
  await requireGlobalAdmin();
  const { db, request } = await loadRequest(String(formData.get("requestId")));
  if (!request) throw new Error("Request not found.");
  const status = String(formData.get("status"));
  if (!["in_progress", "completed", "rejected"].includes(status)) throw new Error("Unknown status.");
  const note = String(formData.get("note") ?? "").trim();
  await db
    .from("data_requests")
    .update({
      status,
      completed_at: status === "completed" || status === "rejected" ? new Date().toISOString() : null,
      admin_note: note ? appendNote(request.admin_note, note) : request.admin_note
    })
    .eq("id", request.id);
  revalidatePath(`/admin/data-requests/${request.id}`);
  revalidatePath("/admin/data-requests");
}

const pounds = (p: number | null) => (p == null ? "—" : `£${(p / 100).toFixed(2)}`);
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function DataRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  await requireGlobalAdmin();
  const { requestId } = await params;
  const { db, request } = await loadRequest(requestId);
  if (!request) notFound();

  const isCustomer = request.requester_type === "customer";
  const autoWorkers = isCustomer ? [] : await linkedWorkers(db, request.email);
  const workers = isCustomer ? [] : (((await db.from("workers").select("id, display_name, role, status, venues(name)").order("display_name")).data ?? []) as any[]);
  const tips = isCustomer
    ? matchCustomerTips(((await db.from("recognition_events").select("*, venues(name), workers(display_name)")).data ?? []) as any[], request).slice(0, 50)
    : [];

  return (
    <AdminShell>
      <Link href="/admin/data-requests" className="text-sm text-ink/60 hover:text-ink">‹ All requests</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-bold">{request.reference}</h1>
        <StatusPill tone={request.status === "completed" ? "good" : request.status === "rejected" ? "neutral" : "warn"}>{request.status.replace("_", " ")} · reply by {day(request.due_on)}</StatusPill>
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl border border-ink/10 bg-white p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-ink/50">Request</dt><dd className="font-medium">{request.request_type === "access" ? "Send a copy of their data" : request.request_type === "delete" ? "Delete their data" : "Correct their data"}</dd></div>
        <div><dt className="text-ink/50">From</dt><dd className="font-medium">{request.requester_type.replace("_", " ")} · {request.email}{request.name ? ` (${request.name})` : ""}</dd></div>
        {isCustomer && <div><dt className="text-ink/50">Their tip</dt><dd>{request.venue_name ?? "—"} · {request.tip_date ?? "any date"} · {pounds(request.amount_pence)}</dd></div>}
        {request.details && <div className="sm:col-span-2"><dt className="text-ink/50">Details</dt><dd className="whitespace-pre-wrap">{request.details}</dd></div>}
        {request.admin_note && <div className="sm:col-span-2"><dt className="text-ink/50">Log</dt><dd className="whitespace-pre-wrap font-mono text-xs">{request.admin_note}</dd></div>}
      </dl>

      <form action={eraseSelected} className="mt-6 grid gap-4 rounded-xl border border-ink/10 bg-white p-5">
        <input type="hidden" name="requestId" value={request.id} />
        <h2 className="font-semibold">{isCustomer ? "Matching tips" : "Their staff records"}</h2>
        {isCustomer ? (
          tips.length === 0 ? (
            <p className="text-sm text-ink/60">No tips match. Ask the person for the venue, date and amount.</p>
          ) : (
            <div className="grid gap-2 text-sm">
              {tips.map((t) => (
                <label key={t.id} className="flex items-start gap-3 rounded-lg bg-[#f6f7f2] p-3">
                  <input type="checkbox" name="tipIds" value={t.id} className="mt-1" />
                  <span>
                    {day(t.created_at)} · {t.venues?.name} · {pounds(t.amount_pence)} to {t.workers?.display_name}
                    <span className="block text-ink/60">{t.message ? `“${t.message}”` : "No note"}</span>
                  </span>
                </label>
              ))}
            </div>
          )
        ) : (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {workers.map((w) => (
              <label key={w.id} className="flex items-center gap-3 rounded-lg bg-[#f6f7f2] p-3">
                <input type="checkbox" name="workerIds" value={w.id} defaultChecked={autoWorkers.includes(w.id)} />
                <span>{w.display_name} · {w.role || "no role"} · {w.venues?.name}{autoWorkers.includes(w.id) ? " · linked to this email" : ""}</span>
              </label>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
          <button formAction={`/api/admin/data-requests/${request.id}/export`} formMethod="get" className="rounded-md border border-ink/15 px-4 py-2 text-sm">
            Download their data (JSON)
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input id="confirmed" type="checkbox" name="confirmed" />
            I&apos;ve confirmed this is the person
          </label>
          <button className="rounded-md bg-[#b33a26] px-4 py-2 text-sm text-white">Erase selected</button>
        </div>
        <p className="text-xs text-ink/50">
          Erasing removes names, photos, notes and dreams{isDemoMode() ? "" : " and deletes the staff member's sign-in"}. Tip amounts and payment references stay for tax records.
        </p>
      </form>

      <form action={setStatus} className="mt-6 grid gap-3 rounded-xl border border-ink/10 bg-white p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <input type="hidden" name="requestId" value={request.id} />
        <label className="grid gap-1 text-sm">Note for the log (for example how you replied)
          <input id="status-note" name="note" className="rounded-md border border-ink/15 px-3 py-2" />
        </label>
        <div className="flex flex-wrap gap-2">
          <button name="status" value="in_progress" className="rounded-md border border-ink/15 px-3 py-2 text-sm">In progress</button>
          <button name="status" value="completed" className="rounded-md bg-ink px-3 py-2 text-sm text-white">Mark completed</button>
          <button name="status" value="rejected" className="rounded-md border border-ink/15 px-3 py-2 text-sm">Reject</button>
        </div>
      </form>
    </AdminShell>
  );
}
