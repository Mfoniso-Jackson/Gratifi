# Venue payouts (Stripe Connect)

GratiFi uses **option A**: tips are paid to the venue, which passes them to staff through payroll.
GratiFi never holds tip money.

## How it works

1. A venue owner clicks **Set up payouts** on their venue page. GratiFi creates a Stripe **Express**
   account for the venue (`lib/payouts/ConnectService.ts`) and sends them to Stripe's own onboarding
   (business details, ID check, bank account). It takes about 10 minutes.
2. Stripe sends `account.updated`; the webhook stores `stripe_charges_enabled` and
   `stripe_payouts_enabled` on the venue (migration 013).
3. Each tip is a Checkout payment with `on_behalf_of` and `transfer_data.destination` set to the
   venue's account. The customer pays the venue; Stripe pays the venue's bank on its normal schedule.
4. `application_fee_amount` is the card fee (1.5% + 20p of the total, `cardFeePence`), which covers what
   Stripe charges GratiFi for the payment. If the customer ticked "cover the card fee", the venue
   still receives the full tip. If not, the venue absorbs the fee. Under the Employment (Allocation
   of Tips) Act 2023 it can't pass that on to staff, so staff get the full tip either way.
5. The venue pays staff through payroll under its written tipping policy. The Payroll export
   add-on lists each person's tips for the period.

Until a venue's account can take payments, its tip pages say it's still setting up and checkout
refuses card tips (`REQUIRE_VENUE_PAYOUTS`, on by default). Owners see a banner in the admin. Demo
mode skips Stripe, and "Set up payouts" marks the venue as connected straight away.

## Stripe setup

- In the Stripe dashboard, enable **Connect** and choose Express accounts. Fill in the platform
  profile (GratiFi collects tips for venues, which pay staff).
- On the webhook endpoint (`/api/stripe/webhook`), also listen to **events on Connected accounts**
  and add `account.updated`. The same signing secret is used.
- Set the Connect branding (logo, colour) so the onboarding pages look like GratiFi.

## Refunds and disputes

With destination charges, the platform account (GratiFi) is charged for refunds and disputes first.

- **Refunds:** refund from the GratiFi dashboard and tick **Reverse transfer** (and **Refund
  application fee**) so the money comes back from the venue, not from GratiFi.
- **Disputes:** Stripe debits GratiFi. Reverse the transfer from the venue's account in the dashboard
  if the dispute is lost. Automating this is a follow-up.

## Fees for GratiFi

Stripe charges for Connect Express accounts (per active account each month, plus a small fee per
payout). One account per venue keeps this low. Check the current UK Connect pricing before launch.
