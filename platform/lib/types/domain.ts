export type VenueStatus = "active" | "inactive";
export type WorkerStatus = "active" | "inactive";
export type MoonbeamStatus = "pending" | "confirmed" | "failed" | "retry";

export interface Venue {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  status: VenueStatus;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  venue_type?: "cafe" | "barbershop" | "pub" | "restaurant" | "other";
  pilot_status?: "prospect" | "onboarded" | "live" | "paused" | "completed";
  pilot_start_date?: string | null;
  pilot_end_date?: string | null;
  qr_placement_notes?: string | null;
  staff_training_completed?: boolean;
  owner_feedback?: string | null;
  staff_feedback?: string | null;
  customer_feedback?: string | null;
  referral_source?: string | null;
  follow_up_date?: string | null;
  created_at: string;
}

export interface Worker {
  id: string;
  venue_id: string;
  display_name: string;
  role: string;
  photo_url: string | null;
  status: WorkerStatus;
  created_at: string;
}

export interface RecognitionEvent {
  id: string;
  venue_id: string;
  worker_id: string;
  amount_pence: number;
  currency: "GBP";
  message: string | null;
  message_hash: string;
  recognition_hash: string;
  stripe_payment_intent_id: string;
  stripe_status: string;
  moonbeam_status: MoonbeamStatus;
  moonbeam_tx_hash: string | null;
  moonbeam_block_number: number | null;
  moonbeam_contract_address: string | null;
  protocol_version: string;
  created_at: string;
  confirmed_at: string | null;
}

export interface RecognitionPayload {
  venueId: string;
  workerId: string;
  amountPence: number;
  currency: "GBP";
  message?: string | null;
  stripePaymentIntentId: string;
  stripeStatus: string;
}
