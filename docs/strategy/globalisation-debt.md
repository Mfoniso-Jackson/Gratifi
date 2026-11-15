# Globalisation debt

Places where the code assumes the UK. None block the UK pilot, so they're **listed, not fixed**,
during the feature freeze. Fix them when Ireland (stage 2) or the US (stage 3) needs them, and
don't add new ones.

Paths are under `platform/`.

| Area | Where | UK assumption | What global needs |
| --- | --- | --- | --- |
| Currency in tips | `lib/services/RecognitionEngine.ts` (`currency: z.literal("GBP")`), `lib/types/domain.ts` | Every tip is GBP | Currency per venue; validate against the venue's currency |
| Currency in Stripe calls | `lib/services/PaymentService.ts`, `lib/billing/BillingService.ts`, `lib/sponsors/InvoiceService.ts`, `lib/payouts/ReversalService.ts` (`"gbp"`) | Charges, plans, invoices and transfers in GBP | Pass the venue's or sponsor's currency through |
| Money formatting | About 26 files format with `£`; about 16 use the `en-GB` locale | Pounds and UK dates everywhere | One shared `formatMoney(amount, currency, locale)` and date helper |
| Column and field names | `amount_pence`, `fee_covered_pence`, `net_gbp` in the payroll export | Pence and GBP in names | Keep minor units, but treat names as "minor units"; add a currency column where missing |
| Card fee rate | `lib/payments/fees.ts` (1.5% + 20p) | Stripe's UK standard rate | Rate per country, from configuration |
| Tip amounts | `components/DreamTipForm.tsx` (£3, £5, £10, £20), `MIN_TIP_AMOUNT_PENCE` | Round pound amounts | Per-country presets; percentages where a bill amount is known (US) |
| Plans and prices | `lib/billing/plans.ts` | Prices in GBP | Price lists per currency |
| Payout accounts | `lib/payouts/ConnectService.ts` (`country: "GB"`) | Venues are in the UK | Use the venue's country |
| Tipping-law wording | `/terms`, the venue Payouts section, docs | Employment (Allocation of Tips) Act 2023 | Per-country wording and tipping-policy templates |
| Privacy and data requests | `/privacy`, `/privacy/requests`, `lib/services/DataRequestService.ts` | UK GDPR, ICO, one-month deadline | Per-region notices and deadlines |
| Language | All pages | English only | Translations once a non-English market is chosen |
| Staff belong to one venue | `workers.venue_id` | A worker exists only inside one venue | A person-level worker account linked to many venues (the stage 3 worker account) |

**Cheapest first step when stage 2 starts:** add `country` and `currency` to `venues`, defaulting
to `GB` and `GBP`, and read them everywhere listed above.
