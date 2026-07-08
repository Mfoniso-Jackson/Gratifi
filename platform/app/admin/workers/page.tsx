import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createWorker(formData: FormData) {
  "use server";
  const db = createServiceClient();
  await db.from("workers").insert({
    venue_id: String(formData.get("venueId")),
    display_name: String(formData.get("displayName")),
    role: String(formData.get("role")),
    status: "active"
  });
  revalidatePath("/admin/workers");
}

export default async function WorkersPage() {
  const db = createServiceClient();
  const workers = await db.from("workers").select("*, venues(name)").order("display_name");
  const venues = await db.from("venues").select("id, name").eq("status", "active").order("name");
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Workers</h1>
      <form action={createWorker} className="mt-6 grid gap-3 rounded-md border border-ink/10 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <select name="venueId" required className="rounded-md border border-ink/15 px-3 py-2">
          {(venues.data ?? []).map((venue: any) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
        </select>
        <input name="displayName" required placeholder="Display name" className="rounded-md border border-ink/15 px-3 py-2" />
        <input name="role" required placeholder="Role" className="rounded-md border border-ink/15 px-3 py-2" />
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
