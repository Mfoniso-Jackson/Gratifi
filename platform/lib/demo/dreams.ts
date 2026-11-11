import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { dreamContribution } from "@/lib/demo/dreamMath";

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

/**
 * Records a dream-linked tip in demo mode: the customer's tip counts toward the dream and, in "match" mode,
 * the sponsor matches it. The tip itself still goes to the worker in full. Returns the amounts added.
 */
export async function applyDemoDreamTip(workerId: string, amountPence: number) {
  const dream = await getDemoDream(workerId);
  if (!dream) return null;
  const { fromTip, match, after } = dreamContribution(dream, amountPence);
  if (fromTip + match <= 0) return null;
  await createServiceClient()
    .from("worker_dreams")
    .update({ funded_pence: after, status: after >= dream.target_pence ? "funded" : "active" })
    .eq("id", dream.id);
  return { fromTip, match, before: dream.funded_pence };
}
