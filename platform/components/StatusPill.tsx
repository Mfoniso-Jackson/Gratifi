type Tone = "good" | "warn" | "bad" | "neutral";

const tones: Record<Tone, string> = {
  good: "bg-mint text-[#1f5c34]",
  warn: "bg-[#fff1d6] text-[#7a5310]",
  bad: "bg-coral/15 text-[#8f2e1f]",
  neutral: "bg-[#eef0ea] text-ink/70"
};

/** A small coloured label for a status. Colour is never the only signal: the words say it too. */
export function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function paymentPill(stripeStatus: string) {
  const label = String(stripeStatus).replaceAll("_", " ");
  if (stripeStatus === "paid" || stripeStatus === "succeeded" || stripeStatus === "dispute_won") return <StatusPill tone="good">{label}</StatusPill>;
  if (stripeStatus === "disputed" || stripeStatus === "partially_refunded") return <StatusPill tone="warn">{label}</StatusPill>;
  return <StatusPill tone="bad">{label}</StatusPill>;
}

export function recordPill(moonbeamStatus: string) {
  if (moonbeamStatus === "confirmed") return <StatusPill tone="good">recorded</StatusPill>;
  if (moonbeamStatus === "pending") return <StatusPill tone="neutral">pending</StatusPill>;
  return <StatusPill tone="warn">{moonbeamStatus === "retry" ? "will retry" : moonbeamStatus}</StatusPill>;
}
