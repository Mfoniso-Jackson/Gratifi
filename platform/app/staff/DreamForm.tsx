"use client";

import { useActionState } from "react";
import { proposeDream, type DreamFormState } from "./actions";

const input = "w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink/40";

export function DreamForm({ workerId }: { workerId: string }) {
  const [state, action, pending] = useActionState<DreamFormState, FormData>(proposeDream, { errors: {}, saved: false });
  if (state.saved) {
    return <p className="rounded-xl bg-mint px-4 py-3 text-sm text-[#1f5c34]">Sent to your manager for approval.</p>;
  }
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-ink/10 bg-white p-5">
      <input type="hidden" name="workerId" value={workerId} />
      {state.errors.form && <p className="text-sm text-[#b33a26]">{state.errors.form}</p>}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label htmlFor="dream-title" className="grid min-w-0 gap-1.5 text-sm font-medium">
          What&apos;s your dream?
          <input id="dream-title" name="title" required maxLength={80} placeholder="Level 2 barista course" className={input} />
          {state.errors.title && <span className="font-normal text-[#b33a26]">{state.errors.title}</span>}
        </label>
        <label htmlFor="dream-target" className="grid min-w-0 gap-1.5 text-sm font-medium">
          What it costs (£)
          <input id="dream-target" name="target" required inputMode="decimal" placeholder="450" className={input} />
          {state.errors.target && <span className="font-normal text-[#b33a26]">{state.errors.target}</span>}
        </label>
      </div>
      <label htmlFor="dream-story" className="grid gap-1.5 text-sm font-medium">
        In your own words <span className="font-normal text-ink/50">(optional, customers will see this)</span>
        <textarea id="dream-story" name="story" maxLength={280} rows={2} className={input} />
        {state.errors.story && <span className="font-normal text-[#b33a26]">{state.errors.story}</span>}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input id="dream-wall" type="checkbox" name="showOnWall" defaultChecked />
        Show my dream on the public Dream Wall
      </label>
      <button disabled={pending} className="rounded-full bg-ink px-5 py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Sending…" : "Send to my manager"}
      </button>
    </form>
  );
}
