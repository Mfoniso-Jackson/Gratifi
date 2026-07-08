import Link from "next/link";
import { AdminShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createVenue(formData: FormData) {
  "use server";
  const db = createServiceClient();
  await db.from("venues").insert({
    name: String(formData.get("name")),
    slug: String(formData.get("slug")),
    address: String(formData.get("address") ?? "") || null,
    status: "active"
  });
  revalidatePath("/admin/venues");
}

export default async function VenuesPage() {
  const db = createServiceClient();
  const venues = await db.from("venues").select("*").order("created_at", { ascending: false });
  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Venues</h1>
      <form action={createVenue} className="mt-6 grid gap-3 rounded-md border border-ink/10 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input name="name" required placeholder="Venue name" className="rounded-md border border-ink/15 px-3 py-2" />
        <input name="slug" required placeholder="venue-slug" className="rounded-md border border-ink/15 px-3 py-2" />
        <input name="address" placeholder="Address" className="rounded-md border border-ink/15 px-3 py-2" />
        <button className="rounded-md bg-ink px-4 py-2 text-white">Create</button>
      </form>
      <div className="mt-6 grid gap-3">
        {(venues.data ?? []).map((venue: any) => (
          <Link key={venue.id} href={`/admin/venues/${venue.id}`} className="rounded-md border border-ink/10 bg-white p-4">
            <p className="font-semibold">{venue.name}</p>
            <p className="text-sm text-ink/60">/v/{venue.slug}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
