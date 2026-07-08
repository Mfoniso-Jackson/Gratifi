import Link from "next/link";
import { PublicShell } from "@/components/Shell";

export default function Home() {
  return (
    <PublicShell>
      <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-6xl content-center gap-10 px-5 pb-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight md:text-7xl">GratiFi</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-ink/70">
            Recognition infrastructure for venues that want every service moment recorded with integrity.
          </p>
          <div className="mt-8 flex gap-3">
            <Link className="rounded-md bg-ink px-5 py-3 text-white" href="/admin">Open admin</Link>
            <Link className="rounded-md border border-ink/15 px-5 py-3" href="/admin/protocol">Protocol status</Link>
          </div>
        </div>
        <div className="rounded-md border border-ink/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-coral">Production-ready recognition</p>
          <div className="mt-6 grid gap-4">
            {["Walletless customer flow", "Stripe-verified payments", "Supabase recognition ledger", "Moonbeam anchoring"].map((item) => (
              <div key={item} className="rounded-md bg-[#eef4f1] p-4 font-medium">{item}</div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
