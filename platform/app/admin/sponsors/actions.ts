"use server";

import { revalidatePath } from "next/cache";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { checkLogo } from "@/lib/sponsors/SponsorService";

const pence = (value: FormDataEntryValue | null) => Math.max(0, Math.round(Number(String(value ?? "0").replace(/[£,\s]/g, "")) * 100) || 0);
const text = (value: FormDataEntryValue | null) => String(value ?? "").trim();
const httpsOrNull = (value: string) => (value.startsWith("https://") ? value : null);

async function uploadLogo(db: any, sponsorId: string, file: File | null) {
  const problem = checkLogo(file);
  if (problem) throw new Error(problem);
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (isDemoMode()) return `data:${file.type};base64,${bytes.toString("base64")}`;
  const ext = file.type.split("/")[1];
  const path = `${sponsorId}-${Date.now()}.${ext}`;
  const upload = await db.storage.from("sponsor-logos").upload(path, bytes, { contentType: file.type, upsert: false });
  if (upload.error) throw upload.error;
  return db.storage.from("sponsor-logos").getPublicUrl(path).data.publicUrl as string;
}

export async function createSponsor(formData: FormData) {
  await requireGlobalAdmin();
  const db = createServiceClient();
  const name = text(formData.get("name"));
  if (name.length < 2) throw new Error("Enter the sponsor's name.");
  const created = await db.from("sponsors").insert({ name, website: httpsOrNull(text(formData.get("website"))), status: "active" }).select("*").single();
  if (created.error) throw created.error;
  const logoUrl = await uploadLogo(db, created.data.id, formData.get("logo") as File | null);
  if (logoUrl) await db.from("sponsors").update({ logo_url: logoUrl }).eq("id", created.data.id);
  revalidatePath("/admin/sponsors");
}

export async function replaceLogo(formData: FormData) {
  await requireGlobalAdmin();
  const db = createServiceClient();
  const sponsorId = text(formData.get("sponsorId"));
  const logoUrl = await uploadLogo(db, sponsorId, formData.get("logo") as File | null);
  if (logoUrl) await db.from("sponsors").update({ logo_url: logoUrl }).eq("id", sponsorId);
  revalidatePath(`/admin/sponsors/${sponsorId}`);
}

export async function createCampaign(formData: FormData) {
  await requireGlobalAdmin();
  const db = createServiceClient();
  const mode = ["match", "milestone", "grant"].includes(text(formData.get("mode"))) ? text(formData.get("mode")) : "match";
  const status = ["draft", "live"].includes(text(formData.get("status"))) ? text(formData.get("status")) : "draft";
  const campaign = await db
    .from("sponsor_campaigns")
    .insert({
      sponsor_id: text(formData.get("sponsorId")),
      name: text(formData.get("name")) || "Campaign",
      mode,
      fund_pence: pence(formData.get("fund")),
      fund_spent_pence: 0,
      placement_fee_pence: pence(formData.get("placementFee")),
      starts_on: text(formData.get("startsOn")) || null,
      ends_on: text(formData.get("endsOn")) || null,
      status
    })
    .select("*")
    .single();
  if (campaign.error) throw campaign.error;
  for (const venueId of formData.getAll("venueIds").map(String)) {
    await db.from("campaign_venues").insert({ campaign_id: campaign.data.id, venue_id: venueId, blocked: false });
  }
  revalidatePath("/admin/sponsors");
}

export async function setCampaignStatus(formData: FormData) {
  await requireGlobalAdmin();
  const status = text(formData.get("status"));
  if (!["draft", "live", "ended"].includes(status)) throw new Error("Unknown status.");
  await createServiceClient().from("sponsor_campaigns").update({ status }).eq("id", text(formData.get("campaignId")));
  revalidatePath("/admin/sponsors");
}

export async function createDream(formData: FormData) {
  await requireGlobalAdmin();
  const target = pence(formData.get("target"));
  if (target <= 0) throw new Error("Enter what the dream costs.");
  await createServiceClient().from("worker_dreams").insert({
    worker_id: text(formData.get("workerId")),
    sponsor_campaign_id: text(formData.get("campaignId")) || null,
    title: text(formData.get("title")),
    story: text(formData.get("story")) || null,
    target_pence: target,
    funded_pence: 0,
    status: "active"
  });
  revalidatePath("/admin/sponsors");
}

export async function withdrawDream(formData: FormData) {
  await requireGlobalAdmin();
  await createServiceClient().from("worker_dreams").update({ status: "withdrawn" }).eq("id", text(formData.get("dreamId")));
  revalidatePath("/admin/sponsors");
}

export async function attachDreamToCampaign(formData: FormData) {
  await requireGlobalAdmin();
  await createServiceClient()
    .from("worker_dreams")
    .update({ sponsor_campaign_id: text(formData.get("campaignId")) || null })
    .eq("id", text(formData.get("dreamId")));
  revalidatePath("/admin/sponsors");
}
