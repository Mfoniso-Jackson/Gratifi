import { cache } from "react";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * The worker records linked to the signed-in account (one per venue the person works at).
 * In demo mode, staff pages show Maya, the first sample barista.
 */
export const getStaffWorkers = cache(async (): Promise<any[] | null> => {
  const db = createServiceClient();
  if (isDemoMode()) {
    const maya = await db.from("workers").select("*, venues(name, slug)").eq("display_name", "Maya");
    return maya.data ?? [];
  }
  const session = await createSessionClient();
  const { data } = await session.auth.getUser();
  if (!data.user) return null;
  const workers = await db.from("workers").select("*, venues(name, slug)").eq("user_id", data.user.id);
  return workers.data ?? [];
});

export async function requireStaff() {
  const workers = await getStaffWorkers();
  if (workers === null) redirect("/staff/login");
  return workers;
}
