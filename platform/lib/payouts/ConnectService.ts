import type Stripe from "stripe";
import { cardFeePence } from "@/lib/payments/fees";

/**
 * Venue payouts through Stripe Connect (option A).
 *
 * Each venue has a Stripe Express account. Tips are destination charges made "on behalf of" the
 * venue: the customer pays the venue, Stripe pays the venue's bank, and the venue passes tips to
 * staff through payroll under its tipping policy. GratiFi never holds tip money.
 *
 * The card fee is kept back as the application fee, which covers what Stripe charges GratiFi for the
 * payment. When the customer ticked "cover the card fee" the venue receives the whole tip; otherwise
 * the venue absorbs the fee, as the Employment (Allocation of Tips) Act 2023 expects of employers
 * (it must still pay staff the full tip).
 */

export interface PayoutVenue {
  id: string;
  name: string;
  contact_email?: string | null;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
  stripe_details_submitted?: boolean | null;
}

export type PayoutState = "not_started" | "incomplete" | "ready" | "restricted";

export function payoutState(venue: PayoutVenue): PayoutState {
  if (!venue.stripe_account_id) return "not_started";
  if (venue.stripe_charges_enabled && venue.stripe_payouts_enabled) return "ready";
  return venue.stripe_details_submitted ? "restricted" : "incomplete";
}

/** Whether new tips must go to a connected account (on unless REQUIRE_VENUE_PAYOUTS=false). */
export function payoutsRequired(env: Record<string, string | undefined> = process.env) {
  return env.REQUIRE_VENUE_PAYOUTS !== "false";
}

/** Whether the venue can take live card tips: payouts set up, or not required (for example in tests). */
export function canTakeCardTips(venue: PayoutVenue, env: Record<string, string | undefined> = process.env) {
  return !payoutsRequired(env) || (Boolean(venue.stripe_account_id) && Boolean(venue.stripe_charges_enabled));
}

/** The part of a Checkout session that sends the payment to the venue. */
export function destinationCharge(accountId: string, totalPence: number): Stripe.Checkout.SessionCreateParams.PaymentIntentData {
  return {
    on_behalf_of: accountId,
    transfer_data: { destination: accountId },
    application_fee_amount: Math.min(cardFeePence(totalPence), totalPence - 1)
  };
}

/** Creates the venue's Express account if it has none, saves it, and returns a Stripe onboarding link. */
export async function startOnboarding(
  stripe: Stripe,
  db: any,
  venue: PayoutVenue,
  urls: { returnUrl: string; refreshUrl: string }
) {
  let accountId = venue.stripe_account_id ?? null;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: venue.contact_email ?? undefined,
      business_profile: { name: venue.name, mcc: "5812", product_description: "Tips from customers for venue staff, via GratiFi" },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { venueId: venue.id }
    });
    accountId = account.id;
    const saved = await db.from("venues").update({ stripe_account_id: accountId, stripe_account_updated_at: new Date().toISOString() }).eq("id", venue.id);
    if (saved.error) throw saved.error;
  }
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: urls.returnUrl,
    refresh_url: urls.refreshUrl
  });
  return link.url;
}

/** A one-time link into the venue's Stripe Express dashboard (payouts, balances, bank details). */
export async function dashboardLink(stripe: Stripe, accountId: string) {
  return (await stripe.accounts.createLoginLink(accountId)).url;
}

/** Keeps a venue's payout status in step with Stripe (account.updated events). */
export async function applyAccountUpdate(db: any, account: Stripe.Account) {
  const byAccount = await db.from("venues").select("id").eq("stripe_account_id", account.id).maybeSingle();
  const venueId = byAccount.data?.id ?? null;
  if (!venueId) return false;
  const result = await db
    .from("venues")
    .update({
      stripe_charges_enabled: Boolean(account.charges_enabled),
      stripe_payouts_enabled: Boolean(account.payouts_enabled),
      stripe_details_submitted: Boolean(account.details_submitted),
      stripe_account_updated_at: new Date().toISOString()
    })
    .eq("id", venueId);
  if (result.error) throw result.error;
  return true;
}
