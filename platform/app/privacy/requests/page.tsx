import Link from "next/link";
import { PublicShell } from "@/components/Shell";
import { RequestForm } from "./RequestForm";

export default function DataRequestsPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 pb-16 pt-6 md:grid-cols-[1fr_1.4fr] md:pt-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-coral">Your data</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight">Ask for your data, or ask us to delete it</h1>
          <p className="mt-4 leading-7 text-ink/70">
            You can ask what GratiFi holds about you, ask us to correct it, or ask us to delete it. We reply within one month. Our{" "}
            <Link href="/privacy" className="underline">privacy notice</Link> explains what we hold and why.
          </p>
          <div className="mt-6 grid gap-3 text-sm leading-6 text-ink/70">
            <p><strong className="text-ink">If you left a tip:</strong> we hold the amount, the time, the venue and any note you wrote. Card details stay with Stripe, not us.</p>
            <p><strong className="text-ink">If you receive tips:</strong> we hold your name, role, photo if added, the tips and notes you received, and any dream you shared.</p>
            <p><strong className="text-ink">What we keep after deleting:</strong> payment amounts and references, because tax rules require them. Notes and personal details are removed. Each tip&apos;s permanent record holds only a scrambled fingerprint, never your name or note.</p>
          </div>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <RequestForm />
        </div>
      </section>
    </PublicShell>
  );
}
