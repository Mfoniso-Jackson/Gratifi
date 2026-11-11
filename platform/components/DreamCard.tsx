import type { Dream } from "@/lib/demo/dreams";

function pounds(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function DreamCard({
  dream,
  workerName,
  matchedPence = 0
}: {
  dream: Dream;
  workerName: string;
  matchedPence?: number;
}) {
  const percent = Math.min(100, Math.round((dream.funded_pence / dream.target_pence) * 100));

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-coral">{workerName}&apos;s dream</p>
        <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink/50 ring-1 ring-ink/10">Sponsored</span>
      </div>
      <p className="mt-2 text-lg font-semibold">{dream.title}</p>
      {dream.story && <p className="mt-1 text-sm leading-6 text-ink/70">{dream.story}</p>}

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-paper ring-1 ring-ink/10" aria-hidden="true">
        <div className="h-full rounded-full bg-coral" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink/70">
        <span className="font-semibold text-ink">{pounds(dream.funded_pence)}</span> of {pounds(dream.target_pence)} · {percent}%
      </p>

      {matchedPence > 0 && (
        <p className="mt-3 rounded-xl bg-mint px-3 py-2 text-sm font-medium text-[#1f5c34]">
          Your thank-you unlocked a {pounds(matchedPence)} match from {dream.sponsor_name}.
        </p>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-4">
        <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink/30 text-[10px] font-semibold text-ink/40">
          LOGO
        </span>
        <p className="text-sm text-ink/70">
          Backed by <span className="font-semibold text-ink">{dream.sponsor_name}</span>
          {dream.mode === "match" && " · matching every thank-you"}
        </p>
      </div>
    </div>
  );
}
