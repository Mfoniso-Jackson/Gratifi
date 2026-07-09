import { PublicShell } from "@/components/Shell";

export default function DemoPage() {
  return (
    <PublicShell>
      <section className="mx-auto max-w-5xl px-5 py-10">
        <p className="text-sm font-semibold text-coral">Demo flow</p>
        <h1 className="mt-2 text-4xl font-bold">How a GratiFi recognition works</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            ["Scan", "A customer sees a thank-you QR at an example café counter and opens the venue page."],
            ["Choose", "They select Maya, an example barista, and choose a simple thank-you amount."],
            ["Pay", "Payment is handled securely. The customer never needs an account or wallet."],
            ["Record", "The recognition is stored with a permanent proof reference for operational verification."]
          ].map(([title, copy]) => (
            <div key={title} className="rounded-md border border-ink/10 bg-white p-5">
              <p className="text-xl font-semibold">{title}</p>
              <p className="mt-2 leading-7 text-ink/70">{copy}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-md border border-ink/10 bg-white p-5">
          <p className="text-sm text-ink/60">Example recognition event</p>
          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <DemoRow label="Venue" value="Demo Café" />
            <DemoRow label="Worker" value="Maya, Barista" />
            <DemoRow label="Recognition" value="£5.00 thank-you" />
            <DemoRow label="Proof reference" value="0x8f4c...demo" />
          </dl>
        </div>
      </section>
    </PublicShell>
  );
}

function DemoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-[#eef4f1] p-3">
      <dt className="text-ink/50">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}
