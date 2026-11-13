/**
 * Sponsor reporting: counts, not claims (see the Brand Promotion Playbook).
 * Also validates uploaded logos.
 */
export interface CampaignReport {
  campaign_id: string;
  campaign_name: string;
  status: string;
  venues: number;
  views: number;
  dream_linked_tips: number;
  customer_to_dreams_pence: number;
  brand_matched_pence: number;
  fund_pence: number;
  fund_left_pence: number;
  dreams: number;
  dreams_completed: number;
  staff_reached: number;
}

export async function campaignReport(db: any, campaign: any): Promise<CampaignReport> {
  const [venues, views, dreams, blocks] = await Promise.all([
    db.from("campaign_venues").select("*").eq("campaign_id", campaign.id),
    db.from("sponsor_views").select("id").eq("campaign_id", campaign.id),
    db.from("worker_dreams").select("*").eq("sponsor_campaign_id", campaign.id),
    db.from("venue_sponsor_blocks").select("venue_id").eq("sponsor_id", campaign.sponsor_id)
  ]);
  const blockedVenues = new Set(((blocks.data ?? []) as any[]).map((b) => b.venue_id));
  const dreamRows = (dreams.data ?? []) as any[];
  const dreamIds = dreamRows.map((d) => d.id);
  const contributions = dreamIds.length
    ? (((await db.from("dream_contributions").select("*").in("dream_id", dreamIds)).data ?? []) as any[])
    : [];
  return {
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    status: campaign.status,
    venues: ((venues.data ?? []) as any[]).filter((v) => !v.blocked && !blockedVenues.has(v.venue_id)).length,
    views: (views.data ?? []).length,
    dream_linked_tips: contributions.filter((c) => c.recognition_event_id || c.from_tip_pence > 0).length,
    customer_to_dreams_pence: contributions.reduce((s, c) => s + Number(c.from_tip_pence ?? 0), 0),
    brand_matched_pence: contributions.reduce((s, c) => s + Number(c.match_pence ?? 0), 0),
    fund_pence: campaign.fund_pence,
    fund_left_pence: Math.max(0, campaign.fund_pence - campaign.fund_spent_pence),
    dreams: dreamRows.length,
    dreams_completed: dreamRows.filter((d) => d.status === "funded").length,
    staff_reached: new Set(dreamRows.map((d) => d.worker_id)).size
  };
}

const pounds = (pence: number) => (pence / 100).toFixed(2);

export function reportCsv(sponsorName: string, reports: CampaignReport[]) {
  const header = [
    "sponsor", "campaign", "status", "venues", "views", "dream_linked_tips", "customer_to_dreams_gbp",
    "brand_matched_gbp", "fund_gbp", "fund_left_gbp", "dreams", "dreams_completed", "staff_reached"
  ];
  const cell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = reports.map((r) =>
    [sponsorName, r.campaign_name, r.status, r.venues, r.views, r.dream_linked_tips, pounds(r.customer_to_dreams_pence),
      pounds(r.brand_matched_pence), pounds(r.fund_pence), pounds(r.fund_left_pence), r.dreams, r.dreams_completed, r.staff_reached]
      .map(cell)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

/** Logos: PNG, JPEG or WebP up to 500 KB. SVG is refused because it can carry scripts. */
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const LOGO_MAX_BYTES = 500 * 1024;

export function checkLogo(file: { type: string; size: number } | null) {
  if (!file || file.size === 0) return null;
  if (!LOGO_TYPES.includes(file.type)) return "Upload a PNG, JPEG or WebP logo.";
  if (file.size > LOGO_MAX_BYTES) return "Keep the logo under 500 KB.";
  return null;
}
