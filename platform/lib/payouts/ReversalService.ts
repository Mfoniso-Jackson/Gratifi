import type Stripe from "stripe";

/**
 * Moves money back from a venue after a refund or dispute (tips are destination charges, so Stripe
 * takes refunds and disputes from GratiFi's platform balance first).
 *
 * - Refund: reverse the refunded amount from the venue's transfer. Done whether or not "Reverse
 *   transfer" was ticked in the dashboard: the amount already reversed is subtracted, so nothing is
 *   taken twice.
 * - Dispute opened: reverse the disputed amount (Stripe debits GratiFi at once).
 * - Dispute won: Stripe returns the funds to GratiFi, so pay the reversed amount back to the venue.
 * - Dispute lost: nothing more to do.
 *
 * GratiFi's application fee is not refunded: Stripe keeps its card fee on a refund, and the fee
 * covers that, so the venue absorbs the card fee here too, as it does on every tip.
 *
 * Every Stripe call has an idempotency key, so a webhook delivered twice moves money once.
 */
export type Adjustment = { kind: "refund_reversal" | "dispute_reversal" | "dispute_return"; amountPence: number; stripeObjectId: string } | null;

function idOf(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function log(db: any, row: { intentId: string | null; kind: NonNullable<Adjustment>["kind"]; amountPence: number; ref: string; objectId: string }) {
  const saved = await db.from("payment_adjustments").insert({
    stripe_payment_intent_id: row.intentId,
    kind: row.kind,
    amount_pence: row.amountPence,
    stripe_ref: row.ref,
    stripe_object_id: row.objectId
  });
  if (saved.error) throw saved.error;
}

/** After charge.refunded: take back the newly refunded part of a venue tip. */
export async function reverseRefund(stripe: Stripe, db: any, charge: Stripe.Charge): Promise<Adjustment> {
  const transferId = idOf(charge.transfer as string | Stripe.Transfer | null);
  if (!transferId) return null; // not a payment to a venue (for example a plan subscription)
  const transfer = await stripe.transfers.retrieve(transferId);
  const owed = Math.min(charge.amount_refunded, transfer.amount) - transfer.amount_reversed;
  if (owed <= 0) return null; // already reversed, for example in the dashboard
  const reversal = await stripe.transfers.createReversal(
    transferId,
    { amount: owed, metadata: { reason: "refund", charge: charge.id } },
    { idempotencyKey: `gratifi-refund-${charge.id}-${charge.amount_refunded}` }
  );
  await log(db, { intentId: idOf(charge.payment_intent as any), kind: "refund_reversal", amountPence: owed, ref: charge.id, objectId: reversal.id });
  return { kind: "refund_reversal", amountPence: owed, stripeObjectId: reversal.id };
}

async function transferForDispute(stripe: Stripe, dispute: Stripe.Dispute) {
  const chargeId = idOf(dispute.charge as string | Stripe.Charge);
  if (!chargeId) return null;
  const charge = await stripe.charges.retrieve(chargeId);
  const transferId = idOf(charge.transfer as string | Stripe.Transfer | null);
  return transferId ? { charge, transfer: await stripe.transfers.retrieve(transferId) } : null;
}

/** After charge.dispute.created: hold the disputed amount back from the venue. */
export async function reverseDispute(stripe: Stripe, db: any, dispute: Stripe.Dispute): Promise<Adjustment> {
  const found = await transferForDispute(stripe, dispute);
  if (!found) return null;
  const amount = Math.min(dispute.amount, found.transfer.amount - found.transfer.amount_reversed);
  if (amount <= 0) return null;
  const reversal = await stripe.transfers.createReversal(
    found.transfer.id,
    { amount, metadata: { reason: "dispute", dispute: dispute.id } },
    { idempotencyKey: `gratifi-dispute-${dispute.id}` }
  );
  await log(db, { intentId: idOf(dispute.payment_intent as any), kind: "dispute_reversal", amountPence: amount, ref: dispute.id, objectId: reversal.id });
  return { kind: "dispute_reversal", amountPence: amount, stripeObjectId: reversal.id };
}

/** After a dispute is won: pay back to the venue what was held back when it opened. */
export async function returnWonDispute(stripe: Stripe, db: any, dispute: Stripe.Dispute): Promise<Adjustment> {
  const logged = ((await db.from("payment_adjustments").select("kind, amount_pence").eq("stripe_ref", dispute.id)).data ?? []) as Array<{ kind: string; amount_pence: number }>;
  const held = logged.filter((r) => r.kind === "dispute_reversal").reduce((sum, r) => sum + r.amount_pence, 0);
  if (held <= 0 || logged.some((r) => r.kind === "dispute_return")) return null;
  const found = await transferForDispute(stripe, dispute);
  const destination = idOf(found?.transfer.destination as string | Stripe.Account | null | undefined);
  if (!destination) return null;
  const transfer = await stripe.transfers.create(
    { amount: held, currency: "gbp", destination, metadata: { reason: "dispute_won", dispute: dispute.id } },
    { idempotencyKey: `gratifi-dispute-won-${dispute.id}` }
  );
  await log(db, { intentId: idOf(dispute.payment_intent as any), kind: "dispute_return", amountPence: held, ref: dispute.id, objectId: transfer.id });
  return { kind: "dispute_return", amountPence: held, stripeObjectId: transfer.id };
}
