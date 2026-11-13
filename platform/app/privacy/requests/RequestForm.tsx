"use client";

import { useActionState, useState } from "react";
import { submitDataRequest, type DataRequestState } from "./actions";

const input = "w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink/40";

function Error({ text }: { text?: string }) {
  return text ? <span className="font-normal text-[#b33a26]">{text}</span> : null;
}

export function RequestForm() {
  const [state, action, pending] = useActionState<DataRequestState, FormData>(submitDataRequest, { errors: {}, reference: null, dueOn: null });
  const [who, setWho] = useState("customer");

  if (state.reference) {
    const due = state.dueOn ? new Date(state.dueOn).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "within a month";
    return (
      <div className="rounded-2xl bg-mint p-6 text-[#1f5c34]">
        <p className="text-lg font-semibold">Request received</p>
        <p className="mt-1">
          Your reference is <strong className="font-mono">{state.reference}</strong>. We&apos;ll reply by email by {due}. We may ask you
          to confirm it&apos;s you before we share or delete anything.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4">
      {state.errors.form && <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-[#b33a26]">{state.errors.form}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="requesterType" className="grid min-w-0 gap-1.5 text-sm font-medium">
          I am
          <select id="requesterType" name="requesterType" value={who} onChange={(e) => setWho(e.target.value)} className={input}>
            <option value="customer">Someone who left a tip</option>
            <option value="staff">A staff member who receives tips</option>
            <option value="venue_owner">A venue owner</option>
            <option value="other">Someone else</option>
          </select>
          <Error text={state.errors.requesterType} />
        </label>
        <label htmlFor="requestType" className="grid min-w-0 gap-1.5 text-sm font-medium">
          I&apos;d like you to
          <select id="requestType" name="requestType" defaultValue="access" className={input}>
            <option value="access">Send me a copy of my data</option>
            <option value="delete">Delete my data</option>
            <option value="correct">Correct my data</option>
          </select>
          <Error text={state.errors.requestType} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="email" className="grid min-w-0 gap-1.5 text-sm font-medium">
          Email for our reply
          <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          <Error text={state.errors.email} />
        </label>
        <label htmlFor="name" className="grid min-w-0 gap-1.5 text-sm font-medium">
          Your name <span className="font-normal text-ink/50">(optional)</span>
          <input id="name" name="name" autoComplete="name" className={input} />
        </label>
      </div>
      {who === "customer" && (
        <fieldset className="grid gap-4 rounded-xl bg-paper p-4 ring-1 ring-ink/10">
          <legend className="px-1 text-sm font-medium">Help us find your tip (we don&apos;t keep customer accounts)</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <label htmlFor="venueName" className="grid min-w-0 gap-1.5 text-sm">
              Venue
              <input id="venueName" name="venueName" className={input} />
              <Error text={state.errors.venueName} />
            </label>
            <label htmlFor="tipDate" className="grid min-w-0 gap-1.5 text-sm">
              Date
              <input id="tipDate" name="tipDate" type="date" className={input} />
              <Error text={state.errors.tipDate} />
            </label>
            <label htmlFor="amount" className="grid min-w-0 gap-1.5 text-sm">
              Amount (£)
              <input id="amount" name="amount" inputMode="decimal" className={input} />
            </label>
          </div>
        </fieldset>
      )}
      <label htmlFor="details" className="grid gap-1.5 text-sm font-medium">
        Anything else we should know <span className="font-normal text-ink/50">(say what to correct, if that&apos;s your request)</span>
        <textarea id="details" name="details" rows={3} maxLength={2000} className={input} />
        <Error text={state.errors.details} />
      </label>
      <button disabled={pending} className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white disabled:opacity-60">
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
