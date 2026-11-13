import { appConfig } from "@/lib/config";
import { REVERSED_STRIPE_STATUSES } from "@/lib/services/StripeWebhookHandler";

export const pilotStatuses = ["prospect", "onboarded", "live", "paused", "completed"] as const;
export const venueTypes = ["cafe", "barbershop", "pub", "restaurant", "other"] as const;

export const defaultChecklist = [
  ["venue_created", "Venue created"],
  ["workers_added", "Workers added"],
  ["venue_qr_generated", "Venue QR generated"],
  ["worker_qr_generated", "Worker QR generated"],
  ["qr_printed", "QR printed"],
  ["qr_placed", "QR placed on counter/mirror/table"],
  ["staff_script_explained", "Staff script explained"],
  ["test_recognition_completed", "Test recognition completed"],
  ["owner_shown_dashboard", "Owner shown dashboard"],
  ["follow_up_scheduled", "Follow-up scheduled"]
] as const;

export interface PilotVenueMetrics {
  venue: any;
  workerCount: number;
  recognitionCount: number;
  totalTipPence: number;
  averageRecognitionPence: number;
  anchorConfirmationRate: number;
  stripeSuccessRate: number;
  qrCodesGenerated: number;
}

export class PilotService {
  constructor(private readonly db: any) {}

  async listPilotVenues(): Promise<PilotVenueMetrics[]> {
    const venues = await this.db
      .from("venues")
      .select("*")
      .order("pilot_status")
      .order("created_at", { ascending: false });
    if (venues.error) throw venues.error;
    return Promise.all((venues.data ?? []).map((venue: any) => this.metricsForVenue(venue)));
  }

  async getVenue(venueId: string) {
    const venue = await this.db.from("venues").select("*").eq("id", venueId).single();
    if (venue.error) throw venue.error;
    return venue.data;
  }

  async getVenueProfile(venueId: string) {
    const venue = await this.getVenue(venueId);
    const [metrics, checklist, evidence, workers] = await Promise.all([
      this.metricsForVenue(venue),
      this.ensureChecklist(venueId),
      this.getEvidence(venueId),
      this.db.from("workers").select("*").eq("venue_id", venueId).order("display_name")
    ]);
    if (workers.error) throw workers.error;
    return { venue, metrics, checklist, evidence, workers: workers.data ?? [] };
  }

  async metricsForVenue(venue: any): Promise<PilotVenueMetrics> {
    const [workers, events] = await Promise.all([
      this.db.from("workers").select("id").eq("venue_id", venue.id),
      this.db.from("recognition_events").select("*").eq("venue_id", venue.id)
    ]);
    if (workers.error) throw workers.error;
    if (events.error) throw events.error;

    const recognitionEvents = events.data ?? [];
    const workerCount = (workers.data ?? []).length;
    const recognitionCount = recognitionEvents.length;
    const totalTipPence = recognitionEvents
      .filter((event: any) => !REVERSED_STRIPE_STATUSES.includes(String(event.stripe_status)))
      .reduce((sum: number, event: any) => sum + Number(event.amount_pence ?? 0), 0);
    const confirmedCount = recognitionEvents.filter((event: any) => event.anchor_status === "confirmed").length;
    const successfulStripeCount = recognitionEvents.filter((event: any) =>
      ["paid", "succeeded"].includes(String(event.stripe_status))
    ).length;

    return {
      venue,
      workerCount,
      recognitionCount,
      totalTipPence,
      averageRecognitionPence: recognitionCount > 0 ? Math.round(totalTipPence / recognitionCount) : 0,
      anchorConfirmationRate: rate(confirmedCount, recognitionCount),
      stripeSuccessRate: rate(successfulStripeCount, recognitionCount),
      qrCodesGenerated: workerCount + 1
    };
  }

  async ensureChecklist(venueId: string) {
    for (const [item_key, label] of defaultChecklist) {
      const result = await this.db
        .from("pilot_checklist_items")
        .upsert({ venue_id: venueId, item_key, label }, { onConflict: "venue_id,item_key", ignoreDuplicates: true });
      if (result.error) throw result.error;
    }

    const checklist = await this.db
      .from("pilot_checklist_items")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at");
    if (checklist.error) throw checklist.error;
    return checklist.data ?? [];
  }

  async getEvidence(venueId: string) {
    const evidence = await this.db
      .from("pilot_evidence")
      .select("*")
      .eq("venue_id", venueId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (evidence.error) throw evidence.error;
    return evidence.data;
  }

  async updateVenueFromForm(venueId: string, formData: FormData) {
    const payload = {
      contact_name: nullable(formData.get("contact_name")),
      contact_email: nullable(formData.get("contact_email")),
      contact_phone: nullable(formData.get("contact_phone")),
      venue_type: String(formData.get("venue_type") ?? "other"),
      pilot_status: String(formData.get("pilot_status") ?? "prospect"),
      pilot_start_date: nullable(formData.get("pilot_start_date")),
      pilot_end_date: nullable(formData.get("pilot_end_date")),
      qr_placement_notes: nullable(formData.get("qr_placement_notes")),
      staff_training_completed: formData.get("staff_training_completed") === "on",
      owner_feedback: nullable(formData.get("owner_feedback")),
      staff_feedback: nullable(formData.get("staff_feedback")),
      customer_feedback: nullable(formData.get("customer_feedback")),
      referral_source: nullable(formData.get("referral_source")),
      follow_up_date: nullable(formData.get("follow_up_date"))
    };

    const result = await this.db.from("venues").update(payload).eq("id", venueId);
    if (result.error) throw result.error;
  }

  async updateChecklistFromForm(venueId: string, formData: FormData) {
    const checklist = await this.ensureChecklist(venueId);
    const selected = new Set(formData.getAll("completed").map(String));

    for (const item of checklist) {
      const completed = selected.has(item.item_key);
      const result = await this.db
        .from("pilot_checklist_items")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", item.id);
      if (result.error) throw result.error;
    }
  }

  async upsertEvidenceFromForm(venueId: string, formData: FormData) {
    const existing = await this.getEvidence(venueId);
    const payload = {
      venue_id: venueId,
      testimonial_text: nullable(formData.get("testimonial_text")),
      feedback_notes: nullable(formData.get("feedback_notes")),
      qr_placement_photo_url: nullable(formData.get("qr_placement_photo_url")),
      screenshot_url: nullable(formData.get("screenshot_url")),
      case_study_notes: nullable(formData.get("case_study_notes")),
      permission_to_use_quote: formData.get("permission_to_use_quote") === "on",
      updated_at: new Date().toISOString()
    };

    const result = existing
      ? await this.db.from("pilot_evidence").update(payload).eq("id", existing.id)
      : await this.db.from("pilot_evidence").insert(payload);
    if (result.error) throw result.error;
  }
}

export function pilotSummaryRows(metrics: PilotVenueMetrics[]) {
  return metrics.map((item) => ({
    venue_id: item.venue.id,
    venue_name: item.venue.name,
    venue_type: item.venue.venue_type ?? "other",
    pilot_status: item.venue.pilot_status ?? "prospect",
    workers_onboarded: item.workerCount,
    qr_codes_generated: item.qrCodesGenerated,
    recognition_events: item.recognitionCount,
    total_tip_volume_gbp: formatMoney(item.totalTipPence),
    anchor_confirmation_rate: percent(item.anchorConfirmationRate),
    stripe_success_rate: percent(item.stripeSuccessRate),
    follow_up_date: item.venue.follow_up_date ?? ""
  }));
}

export function caseStudyMarkdown(profile: {
  venue: any;
  metrics: PilotVenueMetrics;
  checklist: any[];
  evidence: any;
  workers: any[];
}) {
  const { venue, metrics, evidence, workers } = profile;
  const period = [venue.pilot_start_date, venue.pilot_end_date].filter(Boolean).join(" to ") || "Pilot period not set";
  const completedChecklist = profile.checklist.filter((item) => item.completed).length;

  return `# GratiFi Pilot Case Study: ${venue.name}

## Venue

- Type: ${label(venue.venue_type ?? "other")}
- Pilot status: ${label(venue.pilot_status ?? "prospect")}
- Pilot period: ${period}
- Workers onboarded: ${workers.length}

## Recognition Metrics

- Recognition count: ${metrics.recognitionCount}
- Total tip volume: £${formatMoney(metrics.totalTipPence)}
- Average recognition value: £${formatMoney(metrics.averageRecognitionPence)}
- On-chain record rate: ${percent(metrics.anchorConfirmationRate)}
- Stripe success rate: ${percent(metrics.stripeSuccessRate)}
- QR deployment checklist: ${completedChecklist}/${profile.checklist.length} complete

## Owner Quote

${evidence?.permission_to_use_quote && evidence?.testimonial_text ? `> ${evidence.testimonial_text}` : "Quote not approved for public use yet."}

## Staff Feedback

${venue.staff_feedback || evidence?.feedback_notes || "No staff feedback recorded yet."}

## Customer Feedback

${venue.customer_feedback || "No customer feedback recorded yet."}

## Lessons Learned

${evidence?.case_study_notes || "Add operational lessons after the pilot follow-up."}

## Next Steps

- Review QR placement.
- Compare recognition events to QR scans.
- Confirm whether the venue should continue after the pilot.
- Ask for referrals if the owner feedback is positive.
`;
}

export function venueSummaryJson(profile: any) {
  return {
    venue: profile.venue,
    metrics: {
      workers_onboarded: profile.metrics.workerCount,
      qr_codes_generated: profile.metrics.qrCodesGenerated,
      recognition_events: profile.metrics.recognitionCount,
      total_tip_volume_pence: profile.metrics.totalTipPence,
      average_recognition_pence: profile.metrics.averageRecognitionPence,
      anchor_confirmation_rate: profile.metrics.anchorConfirmationRate,
      stripe_success_rate: profile.metrics.stripeSuccessRate
    },
    checklist: profile.checklist,
    evidence: profile.evidence,
    worker_count: profile.workers.length,
    exported_at: new Date().toISOString()
  };
}

export function formatMoney(pence: number) {
  return (pence / 100).toFixed(2);
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function appVenueUrl(slug: string) {
  return `${appConfig.appUrl}/v/${slug}`;
}

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function nullable(value: FormDataEntryValue | null) {
  const stringValue = String(value ?? "").trim();
  return stringValue.length > 0 ? stringValue : null;
}

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
