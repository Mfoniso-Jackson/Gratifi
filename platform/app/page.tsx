import Link from "next/link";
import { Avatar, PublicShell } from "@/components/Shell";
import { isDemoMode } from "@/lib/demo/mode";

// Rendered per request so the demo-mode banner and links reflect the runtime environment.
export const dynamic = "force-dynamic";

const steps = [
  ["Scan", "A small QR card sits on the counter, table or mirror. Customers scan it with their phone camera."],
  ["Thank", "They pick who served them, choose an amount and can add a short note. No app, no sign-up."],
  ["Recorded", "The tip goes to your team and the thank-you is permanently recorded, so nothing gets lost."]
];

const benefits = [
  ["Staff feel seen", "Named thank-yous reach the person who earned them, with the customer's own words."],
  ["Nothing to install", "Print a QR card and you're live. Works on any phone, with payments secured by Stripe."],
  ["A record you can trust", "Every recognition gets a permanent proof reference you can check and export at any time."],
  ["See what's working", "Your dashboard shows recognitions, totals and messages by team member."]
];

export default function Home() {
  const demo = isDemoMode();

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-8 md:grid-cols-[1.15fr_0.85fr] md:items-center md:pt-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-medium text-ink/70 ring-1 ring-ink/10">
            <span className="h-2 w-2 rounded-full bg-coral" /> For cafés, barbers, pubs and restaurants
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Let customers thank the people who served them.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            One QR code on the counter. Customers choose a team member, leave a tip and a note, and every thank-you is
            permanently recorded. No app or account needed.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="rounded-full bg-ink px-6 py-3 font-medium text-white hover:bg-ink/85" href={demo ? "/v/demo-cafe" : "/demo"}>
              {demo ? "Try it as a customer" : "See how it works"}
            </Link>
            <Link className="rounded-full border border-ink/15 bg-white px-6 py-3 font-medium hover:border-ink/40" href={demo ? "/admin" : "/for-venues"}>
              {demo ? "View the venue dashboard" : "Start a free pilot"}
            </Link>
          </div>
        </div>

        <PhonePreview />
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-coral">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Thirty seconds from scan to thank-you</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(([title, copy], i) => (
              <li key={title}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-semibold text-white">{i + 1}</span>
                <p className="mt-4 text-xl font-semibold">{title}</p>
                <p className="mt-2 leading-7 text-ink/70">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-coral">Why venues use GratiFi</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight">Recognition your team can actually see</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {benefits.map(([title, copy]) => (
            <div key={title} className="rounded-2xl border border-ink/10 bg-white p-6">
              <p className="text-lg font-semibold">{title}</p>
              <p className="mt-2 leading-7 text-ink/70">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-8 py-10 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Running a pilot at your venue?</h2>
            <p className="mt-2 max-w-xl text-white/70">Setup takes about ten minutes: add your team, print your QR card, and you're live.</p>
          </div>
          <Link href="/for-venues" className="rounded-full bg-coral px-6 py-3 font-semibold text-ink hover:bg-[#ff8a77]">
            Start your free pilot
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}

function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[320px]" aria-hidden="true">
      <div className="rounded-[2.5rem] bg-ink p-3 shadow-2xl shadow-ink/20">
        <div className="rounded-[2rem] bg-paper px-5 pb-6 pt-8">
          <p className="text-xs text-ink/50">Juniper &amp; Oak Café</p>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name="Maya" />
            <div>
              <p className="text-lg font-semibold leading-tight">Thank Maya</p>
              <p className="text-sm text-ink/60">Barista</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-sm font-semibold">
            {["£3", "£5", "£10", "£20"].map((amount) => (
              <span
                key={amount}
                className={`rounded-xl py-2.5 text-center ${amount === "£5" ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10"}`}
              >
                {amount}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-white p-3 text-sm leading-6 text-ink/70 ring-1 ring-ink/10">
            Best flat white in town, and you remembered my name!
          </div>
          <div className="mt-4 rounded-full bg-coral py-3 text-center text-sm font-semibold text-ink">Send £5 thank-you</div>
          <p className="mt-3 text-center text-[11px] text-ink/40">Secured by Stripe · No account needed</p>
        </div>
      </div>
    </div>
  );
}
