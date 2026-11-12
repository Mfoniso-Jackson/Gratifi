import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { canAccessVenue, requireAdmin, scopeToVenues } from "@/lib/auth/access";

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
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Workers</h1>
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
          <div key={worker.id} className="rounded-md border border-ink/10 bg-white p-4">
            <p className="font-semibold">{worker.display_name}</p>
            <p className="text-sm text-ink/60">{worker.role} at {worker.venues?.name}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
