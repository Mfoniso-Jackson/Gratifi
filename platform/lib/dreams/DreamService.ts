import { sponsorsEnabled } from "@/lib/features";
import { dreamContribution } from "@/lib/dreams/math";

/**
 * The Dream Fund: a staff member's goal, optionally backed by a sponsor campaign.
 * Everything here returns nothing while sponsors are switched off (see lib/features.ts).
 */
export interface Dream {
  id: string;
  worker_id: string;
  title: string;
  story: string | null;
  target_pence: number;
  funded_pence: number;
  status: "active" | "funded" | "withdrawn";
  campaign_id: string | null;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  mode: "match" | "milestone" | "grant" | null;
  /** Money left in the sponsor's fund for matching; null when there is no sponsor. */
  fund_left_pence: number | null;
}

async function campaignFor(db: any, campaignId: string | null) {
  if (!campaignId) return null;
  const campaign = (await db.from("sponsor_campaigns").select("*").eq("id", campaignId).maybeSingle()).data;
  if (!campaign || campaign.status !== "live") return null;
  const sponsor = (await db.from("sponsors").select("*").eq("id", campaign.sponsor_id).maybeSingle()).data;
  if (!sponsor || sponsor.status !== "active") return null;
  return { campaign, sponsor };
}

/** The dream shown for a worker, or null (none, withdrawn, or sponsors switched off). */
export async function getDream(db: any, workerId: string): Promise<Dream | null> {
  if (!sponsorsEnabled()) return null;
  const rows = ((await db.from("worker_dreams").select("*").eq("worker_id", workerId)).data ?? []) as any[];
  const row = rows.filter((r) => r.status !== "withdrawn").sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).at(0);
  if (!row) return null;

  const backing = await campaignFor(db, row.sponsor_campaign_id);
  if (backing) {
    const worker = (await db.from("workers").select("venue_id").eq("id", workerId).maybeSingle()).data;
    const link = worker
      ? (await db.from("campaign_venues").select("*").eq("campaign_id", backing.campaign.id).eq("venue_id", worker.venue_id).maybeSingle()).data
      : null;
    // A campaign only shows in venues it runs in, and never where the venue has blocked the sponsor.
    if (!link || link.blocked) return { ...dreamFields(row), campaign_id: null, sponsor_name: null, sponsor_logo_url: null, mode: null, fund_left_pence: null };
  }
  return {
    ...dreamFields(row),
    campaign_id: backing?.campaign.id ?? null,
    sponsor_name: backing?.sponsor.name ?? null,
    sponsor_logo_url: backing?.sponsor.logo_url ?? null,
    mode: backing?.campaign.mode ?? null,
    fund_left_pence: backing ? Math.max(0, backing.campaign.fund_pence - backing.campaign.fund_spent_pence) : null
  };
}

function dreamFields(row: any) {
  return {
    id: row.id,
    worker_id: row.worker_id,
    title: row.title,
    story: row.story ?? null,
    target_pence: row.target_pence,
    funded_pence: row.funded_pence,
    status: row.status
  };
}

/**
 * Records a dream-linked tip: the customer's tip counts toward the dream and, in match mode, the sponsor
 * matches it from the campaign fund. The tip itself still goes to the worker in full. A recognition is
 * only ever counted once, so a repeated Stripe webhook changes nothing.
 */
export async function applyDreamTip(db: any, input: { workerId: string; amountPence: number; recognitionId?: string | null }) {
  const dream = await getDream(db, input.workerId);
  if (!dream || dream.status !== "active") return null;
  if (input.recognitionId) {
    const existing = await db.from("dream_contributions").select("id").eq("recognition_event_id", input.recognitionId).maybeSingle();
    if (existing.data) return null;
  }
  const { fromTip, match, after } = dreamContribution(dream, input.amountPence);
  if (fromTip + match <= 0) return null;

  await db.from("worker_dreams").update({ funded_pence: after, status: after >= dream.target_pence ? "funded" : "active" }).eq("id", dream.id);
  await db.from("dream_contributions").insert({
    dream_id: dream.id,
    recognition_event_id: input.recognitionId ?? null,
    from_tip_pence: fromTip,
    match_pence: match
  });
  if (match > 0 && dream.campaign_id) {
    const campaign = (await db.from("sponsor_campaigns").select("fund_spent_pence").eq("id", dream.campaign_id).single()).data;
    await db.from("sponsor_campaigns").update({ fund_spent_pence: (campaign?.fund_spent_pence ?? 0) + match }).eq("id", dream.campaign_id);
  }
  return { fromTip, match, before: dream.funded_pence };
}

/** Counts a sponsor placement being shown. Never throws: counting must not break a customer's page. */
export async function recordSponsorView(db: any, view: { campaignId: string | null; venueId: string | null; page: "tip" | "thank_you" }) {
  if (!view.campaignId) return;
  try {
    await db.from("sponsor_views").insert({ campaign_id: view.campaignId, venue_id: view.venueId, page: view.page });
  } catch (error) {
    console.error("Could not record sponsor view:", error);
  }
}
