import type { Dream } from "@/lib/dreams/DreamService";

function pounds(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
}

export function DreamCard({
  dream,
  workerName,
  matchedPence = 0,
  beforePence
}: {
  dream: Dream;
  workerName: string;
  matchedPence?: number;
  /** Progress before this customer's dream-linked tip; when set, the card shows how far they moved it. */
  beforePence?: number;
}) {
  const pct = (pence: number) => Math.min(100, Math.round((pence / dream.target_pence) * 100));
  const percent = pct(dream.funded_pence);
  const beforePercent = beforePence === undefined ? percent : pct(beforePence);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-coral">{workerName}&apos;s dream</p>
        {dream.sponsor_name && <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-ink/50 ring-1 ring-ink/10">Sponsored</span>}
      </div>
      <p className="mt-2 text-lg font-semibold">{dream.title}</p>
      {dream.story && <p className="mt-1 text-sm leading-6 text-ink/70">{dream.story}</p>}

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-paper ring-1 ring-ink/10" aria-hidden="true">
        <div className="h-full bg-coral" style={{ width: `${beforePercent}%` }} />
        <div className="h-full bg-[#2f8a4c]" style={{ width: `${percent - beforePercent}%` }} />
      </div>
      <p className="mt-2 text-sm text-ink/70">
        <span className="font-semibold text-ink">{pounds(dream.funded_pence)}</span> of {pounds(dream.target_pence)} · {percent}%
      </p>

      {beforePence !== undefined && (
        <p className="mt-3 rounded-xl bg-mint px-3 py-2 text-sm font-medium text-[#1f5c34]">
          You moved {workerName} from {beforePercent}% to {percent}%
          {matchedPence > 0 ? `, including a ${pounds(matchedPence)} match from ${dream.sponsor_name}.` : "."}
          {dream.status === "funded" && " Dream complete!"}
        </p>
      )}

      {dream.sponsor_name && (
        <div className="mt-4 flex items-center gap-3 border-t border-ink/10 pt-4">
          {dream.sponsor_logo_url && /^(https:\/\/|data:image\/(png|jpeg|webp);)/.test(dream.sponsor_logo_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dream.sponsor_logo_url} alt="" className="h-9 w-12 shrink-0 rounded-lg object-contain" />
          ) : (
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink/30 text-[10px] font-semibold text-ink/40">
              LOGO
            </span>
          )}
          <p className="text-sm text-ink/70">
            Backed by <span className="font-semibold text-ink">{dream.sponsor_name}</span>
            {dream.mode === "match" && " · matching every thank-you"}
          </p>
        </div>
      )}
    </div>
  );
}
