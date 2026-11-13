import { createHash } from "node:crypto";
import { defaultChecklist } from "@/lib/services/PilotService";

type Row = Record<string, any>;

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 12) {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hour, (days * 17) % 60, 0, 0);
  return d.toISOString();
}

function dateOnly(offsetDays: number) {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

function hex(seed: string) {
  return "0x" + createHash("sha256").update(seed).digest("hex");
}

export function demoUuid(prefix: string, n: number) {
  return `${prefix.padEnd(8, "0").slice(0, 8)}-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

export function buildDemoData(): Record<string, Row[]> {
  const venues: Row[] = [
    {
      id: demoUuid("de30a001", 1),
      slug: "demo-cafe",
      referral_code: "juniper1",
      signup_source: "admin",
      name: "Juniper & Oak Café",
      address: "14 Market Street, Bristol",
      status: "active",
      contact_name: "Priya Shah",
      contact_email: "owner@example.com",
      contact_phone: null,
      venue_type: "cafe",
      pilot_status: "live",
      pilot_start_date: dateOnly(-21),
      pilot_end_date: dateOnly(21),
      qr_placement_notes: "Counter stand by the till, plus table cards on the window bar.",
      staff_training_completed: true,
      owner_feedback: "Staff love seeing the messages. Regulars have started asking for the card.",
      staff_feedback: "The thank-you notes mean more than the money some days.",
      customer_feedback: "Quick — didn't need to download anything.",
      referral_source: "Local business network",
      follow_up_date: dateOnly(4),
      created_at: daysAgo(24)
    },
    {
      id: demoUuid("de30a001", 2),
      slug: "sharp-and-co",
      referral_code: "sharpco2",
      signup_source: "self_serve",
      name: "Sharp & Co Barbers",
      address: "3 Hope Lane, Leeds",
      status: "active",
      contact_name: "Marcus Hale",
      contact_email: "marcus@example.com",
      contact_phone: null,
      venue_type: "barbershop",
      pilot_status: "onboarded",
      pilot_start_date: dateOnly(-5),
      pilot_end_date: dateOnly(37),
      qr_placement_notes: "Small card on each mirror.",
      staff_training_completed: true,
      owner_feedback: null,
      staff_feedback: null,
      customer_feedback: null,
      referral_source: "Instagram",
      follow_up_date: dateOnly(9),
      created_at: daysAgo(8)
    },
    {
      id: demoUuid("de30a001", 3),
      slug: "the-lamplighter",
      referral_code: "lamplit3",
      signup_source: "self_serve",
      referred_by_code: "juniper1",
      name: "The Lamplighter",
      address: "88 Canal Road, Manchester",
      status: "active",
      contact_name: "Ellie Byrne",
      contact_email: "ellie@example.com",
      contact_phone: null,
      venue_type: "pub",
      pilot_status: "prospect",
      pilot_start_date: null,
      pilot_end_date: null,
      qr_placement_notes: null,
      staff_training_completed: false,
      owner_feedback: null,
      staff_feedback: null,
      customer_feedback: null,
      referral_source: "Referral from Juniper & Oak",
      follow_up_date: dateOnly(2),
      created_at: daysAgo(2)
    }
  ];

  const workerSeeds: Array<[number, string, string]> = [
    [0, "Maya", "Barista"],
    [0, "Tom", "Head barista"],
    [0, "Aisha", "Front of house"],
    [0, "Leo", "Kitchen"],
    [1, "Dev", "Senior barber"],
    [1, "Sam", "Barber"],
    [2, "Niamh", "Bar staff"]
  ];

  const workers: Row[] = workerSeeds.map(([venueIndex, name, role], i) => ({
    id: demoUuid("de30b002", i + 1),
    venue_id: venues[venueIndex].id,
    display_name: name,
    role,
    photo_url: null,
    status: "active",
    created_at: daysAgo(20 - i)
  }));

  const messages = [
    "Best flat white in town, and you remembered my name!",
    "Thanks for squeezing me in before work.",
    "You made a rough morning a lot better.",
    null,
    "Perfect fade as always.",
    "Lovely service, thank you.",
    null,
    "The cake recommendation was spot on.",
    "Thanks for being so patient with my order.",
    null
  ];
  const amounts = [300, 500, 500, 1000, 300, 500, 200, 500, 1000, 300, 500, 2000];
  const eventPlan: Array<[number, number]> = [
    // [workerIndex, daysAgo]
    [0, 0], [1, 0], [0, 1], [2, 1], [4, 1], [0, 2], [1, 3], [3, 3], [5, 4], [0, 5],
    [2, 6], [1, 7], [0, 8], [4, 9], [2, 10], [0, 12], [1, 14], [3, 16], [0, 18], [2, 20]
  ];

  const recognition_events: Row[] = eventPlan.map(([workerIndex, ago], i) => {
    const worker = workers[workerIndex];
    const status = i === 0 ? "pending" : i === 3 ? "retry" : "confirmed";
    const recognitionHash = hex(`demo-recognition-${i}`);
    return {
      id: demoUuid("de30c003", i + 1),
      venue_id: worker.venue_id,
      worker_id: worker.id,
      amount_pence: amounts[i % amounts.length],
      currency: "GBP",
      message: messages[i % messages.length],
      message_hash: hex(`demo-message-${i}`),
      recognition_hash: recognitionHash,
      stripe_payment_intent_id: `pi_demo_${String(i + 1).padStart(4, "0")}`,
      stripe_status: "paid",
      moonbeam_status: status,
      moonbeam_tx_hash: status === "confirmed" ? hex(`demo-tx-${i}`) : null,
      moonbeam_block_number: status === "confirmed" ? 9_412_000 + i * 37 : null,
      moonbeam_contract_address: "0x0000000000000000000000000000000000de3000",
      protocol_version: "gratifi-v1",
      created_at: daysAgo(ago, 9 + (i % 9)),
      confirmed_at: status === "confirmed" ? daysAgo(ago, 10 + (i % 9)) : null
    };
  });

  const doneKeys = [
    "venue_created",
    "workers_added",
    "venue_qr_generated",
    "worker_qr_generated",
    "qr_printed",
    "qr_placed",
    "staff_script_explained",
    "test_recognition_completed"
  ];

  const pilot_checklist_items: Row[] = doneKeys.map((item_key, i) => ({
    id: demoUuid("de30d004", i + 1),
    venue_id: venues[0].id,
    item_key,
    label: defaultChecklist.find(([key]) => key === item_key)?.[1] ?? item_key,
    completed: true,
    completed_at: daysAgo(20 - i),
    created_at: daysAgo(22, i)
  }));

  const pilot_evidence: Row[] = [
    {
      id: demoUuid("de30e005", 1),
      venue_id: venues[0].id,
      testimonial_text: "It took ten minutes to set up and the team noticed the difference in week one.",
      feedback_notes: "Staff read the messages aloud at close.",
      qr_placement_photo_url: null,
      screenshot_url: null,
      case_study_notes: "Counter placement beat table cards about 3 to 1.",
      permission_to_use_quote: true,
      created_at: daysAgo(10),
      updated_at: daysAgo(3)
    }
  ];

  // Dream Fund sample: one sponsor ("Your Brand Here", a placeholder for pitching) running a match campaign.
  const sponsors: Row[] = [
    { id: demoUuid("de30f007", 1), name: "Your Brand Here", website: null, logo_url: null, status: "active", created_at: daysAgo(30) }
  ];
  const sponsor_campaigns: Row[] = [
    {
      id: demoUuid("de30f008", 1),
      sponsor_id: sponsors[0].id,
      name: "Autumn dreams pilot",
      mode: "match",
      fund_pence: 200000,
      fund_spent_pence: 48500,
      placement_fee_pence: 0,
      starts_on: dateOnly(-14),
      ends_on: dateOnly(76),
      status: "live",
      created_at: daysAgo(15)
    }
  ];
  const campaign_venues: Row[] = [
    { id: demoUuid("de30f009", 1), campaign_id: sponsor_campaigns[0].id, venue_id: venues[0].id, blocked: false },
    { id: demoUuid("de30f009", 2), campaign_id: sponsor_campaigns[0].id, venue_id: venues[1].id, blocked: false }
  ];
  const worker_dreams: Row[] = [
    {
      id: demoUuid("de30f006", 1),
      worker_id: workers[0].id,
      sponsor_campaign_id: sponsor_campaigns[0].id,
      title: "Level 2 barista course",
      story: "I want to compete in the regional latte art championship next spring.",
      target_pence: 45000,
      funded_pence: 31500,
      status: "active",
      proposed_by: "staff",
      show_on_wall: true,
      created_at: daysAgo(14)
    },
    {
      id: demoUuid("de30f006", 2),
      worker_id: workers[4].id,
      sponsor_campaign_id: sponsor_campaigns[0].id,
      title: "My own barber's chair",
      story: "Saving towards renting my first chair in town.",
      target_pence: 180000,
      funded_pence: 62000,
      status: "active",
      proposed_by: "admin",
      show_on_wall: true,
      created_at: daysAgo(6)
    },
    {
      id: demoUuid("de30f006", 3),
      worker_id: workers[1].id,
      sponsor_campaign_id: null,
      title: "Entry to the regional latte art championship",
      story: "Two years of practice. Time to compete.",
      target_pence: 12000,
      funded_pence: 0,
      status: "pending",
      proposed_by: "staff",
      show_on_wall: true,
      created_at: daysAgo(1)
    }
  ];
  const dream_contributions: Row[] = [
    { id: demoUuid("de30f00a", 1), dream_id: worker_dreams[0].id, recognition_event_id: null, from_tip_pence: 15750, match_pence: 15750, created_at: daysAgo(10) },
    { id: demoUuid("de30f00a", 2), dream_id: worker_dreams[1].id, recognition_event_id: null, from_tip_pence: 29250, match_pence: 32750, created_at: daysAgo(4) }
  ];

  // About three QR scans for every recognition, spread over the same days.
  const qr_scans: Row[] = recognition_events.flatMap((event, i) =>
    [0, 1, 2].map((n) => ({
      id: demoUuid("de30a99a", i * 3 + n + 1),
      venue_id: event.venue_id,
      worker_id: n === 0 ? event.worker_id : null,
      created_at: new Date(Date.parse(event.created_at) - (n + 1) * 7 * 60 * 1000).toISOString()
    }))
  );

  const sponsor_views: Row[] = Array.from({ length: 40 }, (_, i) => ({
    id: demoUuid("de30f00b", i + 1),
    campaign_id: sponsor_campaigns[0].id,
    venue_id: venues[i % 2].id,
    page: i % 3 === 0 ? "thank_you" : "tip",
    created_at: daysAgo(i % 14, 9 + (i % 9))
  }));

  return {
    venues,
    workers,
    recognition_events,
    pilot_checklist_items,
    pilot_evidence,
    sponsors,
    sponsor_campaigns,
    campaign_venues,
    worker_dreams,
    dream_contributions,
    sponsor_views,
    qr_scans
  };
}
