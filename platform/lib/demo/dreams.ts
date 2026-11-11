import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Dream Fund mock-up. Dreams exist only in demo mode for now: there is no
 * database table for them yet, so live mode always returns null.
 */
export interface Dream {
  id: string;
  worker_id: string;
  title: string;
  story: string | null;
  target_pence: number;
  funded_pence: number;
  sponsor_name: string;
  mode: "match" | "milestone" | "grant";
  status: "active" | "funded";
}

export async function getDemoDream(workerId: string): Promise<Dream | null> {
  if (!isDemoMode()) return null;
  const result = await createServiceClient()
    .from("worker_dreams")
    .select("*")
    .eq("worker_id", workerId)
    .maybeSingle();
  return (result.data as Dream | null) ?? null;
}

/** In "match" mode the sponsor matches each tip, up to what the dream still needs. Returns the matched amount. */
export async function applyDemoDreamMatch(workerId: string, amountPence: number): Promise<number> {
  const dream = await getDemoDream(workerId);
  if (!dream || dream.mode !== "match") return 0;
  const match = Math.min(amountPence, dream.target_pence - dream.funded_pence);
  if (match <= 0) return 0;
  const funded = dream.funded_pence + match;
  await createServiceClient()
    .from("worker_dreams")
    .update({ funded_pence: funded, status: funded >= dream.target_pence ? "funded" : "active" })
    .eq("id", dream.id);
  return match;
}
