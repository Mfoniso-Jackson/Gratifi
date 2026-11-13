import { randomBytes } from "node:crypto";
import { venueTypes } from "@/lib/services/PilotService";

/** Self-serve venue signup: validation, slugs, referral codes and creating the venue for its owner. */
export interface SignupInput {
  ownerName: string;
  email: string;
  password: string;
  venueName: string;
  venueType: string;
  address: string;
  referralCode: string;
}

export type SignupErrors = Partial<Record<keyof SignupInput | "form", string>>;

export function readSignup(formData: FormData): SignupInput {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    ownerName: text("ownerName"),
    email: text("email").toLowerCase(),
    password: String(formData.get("password") ?? ""),
    venueName: text("venueName"),
    venueType: text("venueType") || "other",
    address: text("address"),
    referralCode: text("referralCode").toLowerCase()
  };
}

export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {};
  if (input.ownerName.length < 2) errors.ownerName = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = "Enter a valid email address.";
  if (input.password.length < 8) errors.password = "Use at least 8 characters.";
  if (input.venueName.length < 2) errors.venueName = "Enter your venue's name.";
  if (input.venueName.length > 80) errors.venueName = "Keep the venue name under 80 characters.";
  if (!(venueTypes as readonly string[]).includes(input.venueType)) errors.venueType = "Choose a venue type.";
  if (input.referralCode && !/^[a-z0-9]{4,16}$/.test(input.referralCode)) errors.referralCode = "That referral code doesn't look right.";
  return errors;
}

export function slugify(name: string) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "venue";
}

export function newReferralCode() {
  return randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 8).padEnd(8, "0");
}

async function uniqueSlug(db: any, base: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await db.from("venues").select("id").eq("slug", candidate).maybeSingle();
    if (!taken.data) return candidate;
  }
  return `${base}-${newReferralCode().slice(0, 4)}`;
}

/** Returns the code if it belongs to an existing venue, otherwise null (unknown codes are ignored, not errors). */
export async function validReferrer(db: any, code: string) {
  if (!code) return null;
  const venue = await db.from("venues").select("id, referral_code").eq("referral_code", code).maybeSingle();
  return venue.data ? code : null;
}

/** Creates the venue, makes the user its owner and starts the 30-day pilot. */
export async function createVenueForOwner(db: any, input: { userId: string; venueName: string; venueType: string; address: string; referredBy: string | null }) {
  const today = new Date().toISOString().slice(0, 10);
  const venue = await db
    .from("venues")
    .insert({
      name: input.venueName,
      slug: await uniqueSlug(db, slugify(input.venueName)),
      address: input.address || null,
      status: "active",
      venue_type: input.venueType,
      pilot_status: "onboarded",
      pilot_start_date: today,
      referral_code: newReferralCode(),
      referred_by_code: input.referredBy,
      referral_source: input.referredBy ? `Referral code ${input.referredBy}` : "Self-serve signup",
      signup_source: "self_serve"
    })
    .select("*")
    .single();
  if (venue.error) throw venue.error;

  // Never downgrade a GratiFi admin who signs up a venue for testing.
  const existing = await db.from("admin_users").select("role").eq("user_id", input.userId).maybeSingle();
  if (existing.data?.role !== "admin") {
    const role = await db.from("admin_users").upsert({ user_id: input.userId, role: "venue_owner" });
    if (role.error) throw role.error;
  }
  const member = await db.from("venue_members").upsert({ user_id: input.userId, venue_id: venue.data.id });
  if (member.error) throw member.error;
  return venue.data;
}

export function referralLink(appUrl: string, code: string) {
  return `${appUrl}/for-venues?ref=${encodeURIComponent(code)}`;
}
