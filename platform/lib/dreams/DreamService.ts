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
  // Only approved dreams show to customers: pending ones wait for a manager, declined ones never show.
  const row = rows.filter((r) => r.status === "active" || r.status === "funded").sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).at(0);
  if (!row) return null;
  return dreamView(db, row);
}

/** Builds the customer-facing view of a dream row, including its sponsor where the venue allows it. */
export async function dreamView(db: any, row: any): Promise<Dream> {
  const workerId = row.worker_id;

  const backing = await campaignFor(db, row.sponsor_campaign_id);
  if (backing) {
    const worker = (await db.from("workers").select("venue_id").eq("id", workerId).maybeSingle()).data;
    const link = worker
      ? (await db.from("campaign_venues").select("*").eq("campaign_id", backing.campaign.id).eq("venue_id", worker.venue_id).maybeSingle()).data
      : null;
    const venueBlock = worker
      ? (await db.from("venue_sponsor_blocks").select("sponsor_id").eq("venue_id", worker.venue_id).eq("sponsor_id", backing.sponsor.id).maybeSingle()).data
      : null;
    // A campaign only shows in venues it runs in, and never where the venue has blocked the sponsor.
    if (!link || link.blocked || venueBlock) return { ...dreamFields(row), campaign_id: null, sponsor_name: null, sponsor_logo_url: null, mode: null, fund_left_pence: null };
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
export async function recordSponsorView(db: any, view: { campaignId: string | null; venueId: string | null; page: "tip" | "thank_you" | "wall" }) {
  if (!view.campaignId) return;
  try {
    await db.from("sponsor_views").insert({ campaign_id: view.campaignId, venue_id: view.venueId, page: view.page });
  } catch (error) {
    console.error("Could not record sponsor view:", error);
  }
}

/** A worker's most recent dream in any state except withdrawn, for the staff page and approvals. */
export async function latestDreamRow(db: any, workerId: string) {
  const rows = ((await db.from("worker_dreams").select("*").eq("worker_id", workerId)).data ?? []) as any[];
  return rows.filter((r) => r.status !== "withdrawn").sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).at(0) ?? null;
}

export interface DreamProposal {
  title: string;
  story: string | null;
  targetPence: number;
  showOnWall: boolean;
}

export type DreamProposalErrors = Partial<Record<"title" | "story" | "target", string>>;

/** Staff-proposed dreams: £10 to £5,000, a short title and an optional note in their own words. */
export function readDreamProposal(formData: FormData): { proposal: DreamProposal; errors: DreamProposalErrors } {
  const title = String(formData.get("title") ?? "").trim();
  const story = String(formData.get("story") ?? "").trim();
  const pounds = Number(String(formData.get("target") ?? "").replace(/[£,\s]/g, ""));
  const errors: DreamProposalErrors = {};
  if (title.length < 3 || title.length > 80) errors.title = "Describe your dream in 3 to 80 characters.";
  if (story.length > 280) errors.story = "Keep it under 280 characters.";
  if (!Number.isFinite(pounds) || pounds < 10 || pounds > 5000) errors.target = "Enter a cost between £10 and £5,000.";
  return {
    proposal: { title, story: story || null, targetPence: Math.round((Number.isFinite(pounds) ? pounds : 0) * 100), showOnWall: formData.get("showOnWall") === "on" },
    errors
  };
}

export interface WallItem {
  dream: Dream;
  worker: { id: string; display_name: string; role: string; photo_url: string | null };
  venue: { id: string; name: string; slug: string };
}

/**
 * Dreams for the public Dream Wall: approved, opted in by the staff member, at an active venue that is
 * taking tips. Dreams still in progress come first, closest to their goal at the top.
 */
export async function listWallDreams(db: any, options: { venueSlug?: string | null; isTakingTips: (venue: any) => Promise<boolean> }): Promise<WallItem[]> {
  if (!sponsorsEnabled()) return [];
  const rows = ((await db.from("worker_dreams").select("*, workers(*)")).data ?? []) as any[];
  const items: WallItem[] = [];
  const venueCache = new Map<string, any>();

  for (const row of rows) {
    if (!["active", "funded"].includes(row.status) || row.show_on_wall === false) continue;
    const worker = row.workers;
    if (!worker || worker.status !== "active") continue;
    if (!venueCache.has(worker.venue_id)) {
      const venue = (await db.from("venues").select("*").eq("id", worker.venue_id).maybeSingle()).data;
      venueCache.set(worker.venue_id, venue && venue.status === "active" && (await options.isTakingTips(venue)) ? venue : null);
    }
    const venue = venueCache.get(worker.venue_id);
    if (!venue || (options.venueSlug && venue.slug !== options.venueSlug)) continue;
    items.push({
      dream: await dreamView(db, row),
      worker: { id: worker.id, display_name: worker.display_name, role: worker.role, photo_url: worker.photo_url ?? null },
      venue: { id: venue.id, name: venue.name, slug: venue.slug }
    });
  }

  const progress = (item: WallItem) => item.dream.funded_pence / item.dream.target_pence;
  return items.sort((a, b) => {
    if (a.dream.status !== b.dream.status) return a.dream.status === "active" ? -1 : 1;
    return progress(b) - progress(a);
  });
}
