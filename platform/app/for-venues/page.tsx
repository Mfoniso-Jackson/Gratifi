import { PublicShell } from "@/components/Shell";
import { SignupForm } from "./SignupForm";

export const dynamic = "force-dynamic";

const steps = [
  ["Sign up", "Takes two minutes. No card needed."],
  ["Add your team", "Names and roles; photos if you like."],
  ["Print your QR card", "Counter, table or mirror. You're live."]
];

export default async function ForVenuesPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const referralCode = (ref ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);

  return (
    <PublicShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-6 md:grid-cols-[1fr_1.1fr] md:pt-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-coral">For venues</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Try GratiFi free for 30 days</h1>
          <p className="mt-4 max-w-md text-lg leading-8 text-ink/70">
            Let customers thank your team by name, with a tip and a note. Every penny of every tip goes to your staff.
          </p>
          {referralCode && (
            <p className="mt-4 inline-block rounded-full bg-mint px-3 py-1 text-sm text-[#1f5c34]">Referred by a GratiFi venue</p>
          )}
          <ol className="mt-8 grid gap-4">
            {steps.map(([title, copy], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">{i + 1}</span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-ink/70">{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
          <SignupForm referralCode={referralCode} />
        </div>
      </section>
    </PublicShell>
  );
}
