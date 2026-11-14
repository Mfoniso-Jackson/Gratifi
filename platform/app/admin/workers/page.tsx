import Link from "next/link";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canAccessVenue, requireAdmin, scopeToVenues } from "@/lib/auth/access";
import { appConfig } from "@/lib/config";
import { isDemoMode } from "@/lib/demo/mode";
import { findUserIdByEmail } from "@/lib/supabase/authUsers";
import { sponsorsEnabled } from "@/lib/features";

export const dynamic = "force-dynamic";

async function createWorker(formData: FormData) {
  "use server";
  const context = await requireAdmin();
  const venueId = String(formData.get("venueId"));
  if (!canAccessVenue(context, venueId)) throw new Error("You can only add staff to your own venues.");
  const db = createServiceClient();
  await db.from("workers").insert({
    venue_id: venueId,
    display_name: String(formData.get("displayName")),
    role: String(formData.get("role")),
    photo_url: photoUrl(formData.get("photoUrl")),
    status: "active"
  });
  revalidatePath("/admin/workers");
}

async function workerYouManage(workerId: string) {
  const context = await requireAdmin();
  const db = createServiceClient();
  const worker = await db.from("workers").select("id, venue_id").eq("id", workerId).maybeSingle();
  if (!worker.data || !canAccessVenue(context, worker.data.venue_id)) throw new Error("Staff member not found.");
  return { db, worker: worker.data };
}

/** Invites a staff member by email so they can sign in and see their own tips and notes. */
async function inviteStaff(formData: FormData) {
  "use server";
  const { db, worker } = await workerYouManage(String(formData.get("workerId")));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");

  let userId: string | null = null;
  if (isDemoMode()) {
    userId = "demo-staff";
  } else {
    const invite = await (db as any).auth.admin.inviteUserByEmail(email, { redirectTo: `${appConfig.appUrl}/staff` });
    // Someone who already has an account (for example a manager who also takes tips) is linked as they are.
    userId = invite.data?.user?.id ?? (await findUserIdByEmail(db, email));
    if (!userId) throw new Error(invite.error?.message ?? "Could not invite that email address.");
  }
  await db.from("workers").update({ user_id: userId }).eq("id", worker.id);
  revalidatePath("/admin/workers");
}

async function removeStaffAccess(formData: FormData) {
  "use server";
  const { db, worker } = await workerYouManage(String(formData.get("workerId")));
  await db.from("workers").update({ user_id: null }).eq("id", worker.id);
  revalidatePath("/admin/workers");
}

/** Managers approve or decline dreams their staff propose. */
async function reviewDream(formData: FormData) {
  "use server";
  const context = await requireAdmin();
  const db = createServiceClient();
  const dream = (await db.from("worker_dreams").select("*, workers(venue_id)").eq("id", String(formData.get("dreamId"))).maybeSingle()).data;
  if (!dream || dream.status !== "pending" || !canAccessVenue(context, dream.workers?.venue_id)) throw new Error("Dream not found.");
  const approve = formData.get("decision") === "approve";
  await db
    .from("worker_dreams")
    .update({
      status: approve ? "active" : "declined",
      review_note: approve ? null : String(formData.get("note") ?? "").trim().slice(0, 200) || null,
      reviewed_at: new Date().toISOString()
    })
    .eq("id", dream.id);
  revalidatePath("/admin/workers");
}

/** Accepts only https links, so a pasted http or data URL can't end up on public pages. */
function photoUrl(value: FormDataEntryValue | null) {
  const url = String(value ?? "").trim();
  return url.startsWith("https://") ? url : null;
}

export default async function WorkersPage() {
  const context = await requireAdmin();
  const db = createServiceClient();
  const workers = await scopeToVenues(db.from("workers").select("*, venues(name)"), context).order("display_name");
  const venues = await scopeToVenues(db.from("venues").select("id, name").eq("status", "active"), context, "id").order("name");
  const workerIds = ((workers.data ?? []) as any[]).map((w) => w.id);
  const pendingDreams =
    sponsorsEnabled() && workerIds.length
      ? (((await db.from("worker_dreams").select("*, workers(display_name)").in("worker_id", workerIds).eq("status", "pending")).data ?? []) as any[])
      : [];

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Staff</h1>
      {pendingDreams.length > 0 && (
        <section className="mt-6 rounded-xl border border-ink/10 bg-white p-4">
          <h2 className="font-semibold">Dreams waiting for your approval</h2>
          <p className="text-sm text-ink/60">Approved dreams show on the staff member&apos;s tip page{" "}and, if they chose, the public Dream Wall.</p>
          <div className="mt-3 grid gap-3">
            {pendingDreams.map((d) => (
              <form key={d.id} action={reviewDream} className="grid gap-2 rounded-lg bg-[#f6f7f2] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input type="hidden" name="dreamId" value={d.id} />
                <div>
                  <p className="font-medium">{d.workers?.display_name}: {d.title} · £{(d.target_pence / 100).toFixed(0)}</p>
                  {d.story && <p className="text-sm text-ink/70">&ldquo;{d.story}&rdquo;</p>}
                  <input id={`note-${d.id}`} name="note" placeholder="Note if declining (optional)" aria-label="Note if declining" className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2">
                  <button name="decision" value="approve" className="rounded-md bg-ink px-3 py-1.5 text-sm text-white">Approve</button>
                  <button name="decision" value="decline" className="rounded-md border border-ink/15 px-3 py-1.5 text-sm">Decline</button>
                </div>
              </form>
            ))}
          </div>
        </section>
      )}
      <p className="mt-2 text-ink/70">Invite staff by email so they can see their own tips and thank-you notes at <span className="font-mono text-sm">/staff</span>.</p>
      <form action={createWorker} className="mt-6 grid gap-3 rounded-md border border-ink/10 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <select name="venueId" required className="rounded-md border border-ink/15 px-3 py-2">
          {(venues.data ?? []).map((venue: any) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
        </select>
        <input name="displayName" required placeholder="Display name" className="rounded-md border border-ink/15 px-3 py-2" />
        <input name="role" required placeholder="Role" className="rounded-md border border-ink/15 px-3 py-2" />
        <input name="photoUrl" type="url" placeholder="Photo link (https, optional)" className="rounded-md border border-ink/15 px-3 py-2" />
        <button className="rounded-md bg-ink px-4 py-2 text-white">Create</button>
      </form>
      <div className="mt-6 grid gap-3">
        {(workers.data ?? []).map((worker: any) => (
          <div key={worker.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-ink/10 bg-white p-4">
            <div>
              <p className="font-semibold">{worker.display_name}</p>
              <p className="text-sm text-ink/60">{worker.role} at {worker.venues?.name}</p>
              <Link href={`/admin/workers/${worker.id}/card`} className="text-sm underline underline-offset-2">QR and NFC card</Link>
            </div>
            {worker.user_id ? (
              <form action={removeStaffAccess} className="flex items-center gap-3 text-sm">
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-[#1f5c34]">Can sign in</span>
                <input type="hidden" name="workerId" value={worker.id} />
                <button className="text-ink/60 underline">Remove access</button>
              </form>
            ) : (
              <form action={inviteStaff} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="workerId" value={worker.id} />
                <input id={`invite-${worker.id}`} name="email" type="email" required placeholder="Their email" aria-label={`Email for ${worker.display_name}`} className="rounded-md border border-ink/15 px-3 py-1.5" />
                <button className="rounded-md border border-ink/15 px-3 py-1.5">Invite</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
