import type { Dream } from "@/lib/demo/dreams";

/** Splits a dream-linked tip into the customer's contribution and the sponsor's match, capped at what the dream still needs. */
export function dreamContribution(dream: Dream, amountPence: number) {
  const remaining = Math.max(0, dream.target_pence - dream.funded_pence);
  const fromTip = Math.min(amountPence, remaining);
  const match = dream.mode === "match" ? Math.min(amountPence, remaining - fromTip) : 0;
  return { fromTip, match, after: dream.funded_pence + fromTip + match };
}
