"use client";

import { useState } from "react";
import type { Dream } from "@/lib/dreams/DreamService";
import { dreamContribution } from "@/lib/dreams/math";

const amounts = [300, 500, 1000, 2000];

function pounds(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

export function DreamTipForm({
  workerId,
  venueId,
  workerName,
  dream
}: {
  workerId: string;
  venueId: string;
  workerName: string;
  dream: Dream | null;
}) {
  const [amount, setAmount] = useState(500);
  const [linked, setLinked] = useState(Boolean(dream));
  const preview = dream && linked ? dreamContribution(dream, amount) : null;
  const afterPercent = preview && dream ? Math.min(100, Math.round((preview.after / dream.target_pence) * 100)) : 0;

  return (
    <form action="/api/v1/recognitions" method="post" className="mt-8 grid gap-6">
      <input type="hidden" name="workerId" value={workerId} />
      <input type="hidden" name="venueId" value={venueId} />

      <fieldset>
        <legend className="text-sm font-medium">Choose an amount</legend>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {amounts.map((value) => (
            <label
              key={value}
              className="cursor-pointer rounded-xl bg-white py-3 text-center text-lg font-semibold ring-1 ring-ink/15 has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral"
            >
              <input
                type="radio"
                name="amountPence"
                value={value}
                checked={amount === value}
                onChange={() => setAmount(value)}
                className="sr-only"
              />
              {pounds(value)}
            </label>
          ))}
        </div>
      </fieldset>

      {dream && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10 has-[:checked]:ring-2 has-[:checked]:ring-coral">
          <input
            type="checkbox"
            name="dreamLinked"
            checked={linked}
            onChange={(event) => setLinked(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[#ff715b]"
          />
          <span>
            <span className="block font-semibold">Put my tip toward {workerName}&apos;s dream</span>
            <span className="mt-1 block text-sm leading-6 text-ink/70">
              {preview
                ? preview.match > 0
                  ? `Your ${pounds(preview.fromTip)} + a ${pounds(preview.match)} match from ${dream.sponsor_name} takes ${workerName} to ${afterPercent}% of the goal.`
                  : `Your ${pounds(preview.fromTip)} takes ${workerName} to ${afterPercent}% of the goal.`
                : dream.sponsor_name
                  ? `${dream.sponsor_name} matches tips that go toward the dream.`
                  : "Your tip is counted toward the dream."}
            </span>
          </span>
        </label>
      )}

      <label className="grid gap-2">
        <span className="text-sm font-medium">
          Add a note <span className="font-normal text-ink/50">(optional)</span>
        </span>
        <textarea
          name="message"
          maxLength={280}
          rows={3}
          placeholder={`What did ${workerName} do that made your day?`}
          className="rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink/40"
        />
      </label>

      <button className="rounded-full bg-coral px-5 py-4 text-lg font-semibold text-ink transition hover:bg-[#ff8a77]">
        {preview ? `Send ${pounds(amount)} to ${workerName}'s dream` : "Continue to payment"}
      </button>
      <p className="-mt-2 text-center text-sm text-ink/50">Secure checkout with Stripe · No account needed</p>
    </form>
  );
}
