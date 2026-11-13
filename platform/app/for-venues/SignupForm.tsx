"use client";

import { useActionState } from "react";
import { signUpVenue, type SignupState } from "./actions";

const venueTypes = [
  ["cafe", "Café"],
  ["barbershop", "Barbers"],
  ["pub", "Pub"],
  ["restaurant", "Restaurant"],
  ["other", "Something else"]
];

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="grid min-w-0 gap-1.5 text-sm font-medium">
      {label}
      {children}
      {error && <span className="font-normal text-[#b33a26]">{error}</span>}
    </label>
  );
}

const input = "w-full min-w-0 rounded-xl border border-ink/15 bg-white px-4 py-3 font-normal outline-none focus:border-ink/40";

export function SignupForm({ referralCode }: { referralCode: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUpVenue, {
    errors: {},
    values: { referralCode, venueType: "cafe" }
  });
  const v = state.values;

  return (
    <form action={action} className="grid gap-4">
      {state.errors.form && <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-[#b33a26]">{state.errors.form}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="ownerName" label="Your name" error={state.errors.ownerName}>
          <input id="ownerName" name="ownerName" defaultValue={v.ownerName} autoComplete="name" required className={input} />
        </Field>
        <Field id="email" label="Email" error={state.errors.email}>
          <input id="email" name="email" type="email" defaultValue={v.email} autoComplete="email" required className={input} />
        </Field>
      </div>
      <Field id="password" label="Password (8 characters or more)" error={state.errors.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={input} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field id="venueName" label="Venue name" error={state.errors.venueName}>
          <input id="venueName" name="venueName" defaultValue={v.venueName} required className={input} />
        </Field>
        <Field id="venueType" label="Type" error={state.errors.venueType}>
          <select id="venueType" name="venueType" defaultValue={v.venueType} className={input}>
            {venueTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
      </div>
      <Field id="address" label="Address or town (optional)" error={state.errors.address}>
        <input id="address" name="address" defaultValue={v.address} autoComplete="street-address" className={input} />
      </Field>
      <Field id="referralCode" label="Referral code (optional)" error={state.errors.referralCode}>
        <input id="referralCode" name="referralCode" defaultValue={v.referralCode} className={input} />
      </Field>
      <button disabled={pending} className="rounded-full bg-ink px-6 py-3.5 font-semibold text-white disabled:opacity-60">
        {pending ? "Setting up your venue…" : "Start my free 30-day pilot"}
      </button>
      <p className="text-center text-xs text-ink/50">No card needed for the pilot. You choose a plan before day 30.</p>
    </form>
  );
}
