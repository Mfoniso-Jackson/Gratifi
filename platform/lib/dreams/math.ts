import type { Dream } from "@/lib/dreams/DreamService";

/**
 * Splits a dream-linked tip into the customer's contribution and the sponsor's match, capped at what the
 * dream still needs and, for the match, at what is left in the sponsor's fund.
 */
export function dreamContribution(dream: Dream, amountPence: number) {
  const remaining = Math.max(0, dream.target_pence - dream.funded_pence);
  const fromTip = Math.min(amountPence, remaining);
  const fundLeft = dream.fund_left_pence ?? Number.POSITIVE_INFINITY;
  const match = dream.mode === "match" ? Math.max(0, Math.min(amountPence, remaining - fromTip, fundLeft)) : 0;
  return { fromTip, match, after: dream.funded_pence + fromTip + match };
}
