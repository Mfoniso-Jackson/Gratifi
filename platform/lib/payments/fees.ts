/**
 * Optional "cover the card fee" add-on at checkout, so the staff member gets the whole tip.
 *
 * Based on Stripe's standard UK card rate (1.5% + 20p). Premium and non-UK cards cost Stripe more,
 * so on those GratiFi still absorbs a little. Change the rate here if the Stripe contract changes.
 */
export const CARD_FEE_PERCENT = 1.5;
export const CARD_FEE_FIXED_PENCE = 20;

/** Extra pence that make the payment cover its own fee: (tip + fixed) / (1 - percent), rounded up. */
export function coverFeePence(tipPence: number) {
  if (!Number.isInteger(tipPence) || tipPence <= 0) return 0;
  const gross = Math.ceil((tipPence + CARD_FEE_FIXED_PENCE) / (1 - CARD_FEE_PERCENT / 100));
  return gross - tipPence;
}

/** The tip a checkout was for. Older sessions without tipPence in metadata were tip-only. */
export function tipFromSession(session: { amount_total?: number | null; metadata?: Record<string, string> | null }) {
  const total = session.amount_total ?? 0;
  const tip = Number(session.metadata?.tipPence);
  return Number.isInteger(tip) && tip > 0 && tip <= total ? tip : total;
}
