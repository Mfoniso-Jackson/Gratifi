"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { sponsorsEnabled } from "@/lib/features";
import { latestDreamRow, readDreamProposal, type DreamProposalErrors } from "@/lib/dreams/DreamService";
import { createServiceClient } from "@/lib/supabase/server";

export interface DreamFormState {
  errors: DreamProposalErrors & { form?: string };
  saved: boolean;
}

/** A staff member proposes a dream for one of their own worker records; their manager approves it. */
export async function proposeDream(_previous: DreamFormState, formData: FormData): Promise<DreamFormState> {
  if (!sponsorsEnabled()) return { errors: { form: "Dreams aren't switched on yet." }, saved: false };
  const workers = await requireStaff();
  const worker = workers.find((w) => w.id === String(formData.get("workerId")));
  if (!worker) return { errors: { form: "We couldn't find your staff record." }, saved: false };

  const { proposal, errors } = readDreamProposal(formData);
  if (Object.keys(errors).length > 0) return { errors, saved: false };

  const db = createServiceClient();
  const current = await latestDreamRow(db, worker.id);
  if (current && ["pending", "active"].includes(current.status)) {
    return { errors: { form: "You already have a dream. Withdraw it first to start a new one." }, saved: false };
  }
  await db.from("worker_dreams").insert({
    worker_id: worker.id,
    sponsor_campaign_id: null,
    title: proposal.title,
    story: proposal.story,
    target_pence: proposal.targetPence,
    funded_pence: 0,
    status: "pending",
    proposed_by: "staff",
    show_on_wall: proposal.showOnWall
  });
  revalidatePath("/staff");
  return { errors: {}, saved: true };
}

export async function withdrawMyDream(formData: FormData) {
  const workers = await requireStaff();
  const db = createServiceClient();
  const dream = (await db.from("worker_dreams").select("id, worker_id").eq("id", String(formData.get("dreamId"))).maybeSingle()).data;
  if (!dream || !workers.some((w) => w.id === dream.worker_id)) throw new Error("Dream not found.");
  await db.from("worker_dreams").update({ status: "withdrawn" }).eq("id", dream.id);
  revalidatePath("/staff");
}
