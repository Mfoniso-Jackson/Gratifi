import { describe, expect, it } from "vitest";
import { caseStudyMarkdown, pilotSummaryRows } from "@/lib/services/PilotService";

describe("PilotService helpers", () => {
  const profile = {
    venue: {
      id: "venue-1",
      slug: "demo-cafe",
      name: "Demo Cafe",
      venue_type: "cafe",
      pilot_status: "live",
      pilot_start_date: "2026-07-01",
      pilot_end_date: "2026-07-31",
      staff_feedback: "The staff script felt natural.",
      customer_feedback: "Customers understood the QR quickly."
    },
    metrics: {
      venue: {},
      workerCount: 2,
      recognitionCount: 4,
      totalTipPence: 2000,
      averageRecognitionPence: 500,
      moonbeamConfirmationRate: 0.75,
      stripeSuccessRate: 1,
      qrCodesGenerated: 3
    },
    checklist: [{ completed: true }, { completed: false }],
    evidence: {
      permission_to_use_quote: true,
      testimonial_text: "It helped us see appreciation clearly.",
      case_study_notes: "Counter placement worked best."
    },
    workers: [{ id: "worker-1" }, { id: "worker-2" }]
  };

  it("builds pilot summary rows", () => {
    const rows = pilotSummaryRows([profile.metrics as any]);
    expect(rows[0].qr_codes_generated).toBe(3);
    expect(rows[0].total_tip_volume_gbp).toBe("20.00");
  });

  it("generates a case study markdown draft", () => {
    const markdown = caseStudyMarkdown(profile as any);
    expect(markdown).toContain("GratiFi Pilot Case Study: Demo Cafe");
    expect(markdown).toContain("Moonbeam confirmation rate: 75%");
    expect(markdown).toContain("> It helped us see appreciation clearly.");
  });
});
