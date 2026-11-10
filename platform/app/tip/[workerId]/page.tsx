import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, PublicShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { WorkerService } from "@/lib/services/WorkerService";

export const dynamic = "force-dynamic";

const amounts = [
  ["300", "£3"],
  ["500", "£5"],
  ["1000", "£10"],
  ["2000", "£20"]
];

export default async function TipPage({ params }: { params: Promise<{ workerId: string }> }) {
  const { workerId } = await params;
  const db = createServiceClient();
  const worker = await new WorkerService(db).get(workerId);
  if (worker.error || !worker.data) notFound();
  const venue = worker.data.venues;

  return (
    <PublicShell minimal>
      <section className="mx-auto max-w-md px-5 pb-12 pt-4">
        {venue?.slug && (
          <Link href={`/v/${venue.slug}`} className="text-sm text-ink/60 hover:text-ink">
            ‹ {venue.name}
          </Link>
        )}
        <div className="mt-4 flex items-center gap-4">
          <Avatar name={worker.data.display_name} size="h-16 w-16 text-2xl" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Thank {worker.data.display_name}</h1>
            <p className="text-ink/60">{worker.data.role}</p>
          </div>
        </div>

        <form action="/api/v1/recognitions" method="post" className="mt-8 grid gap-6">
          <input type="hidden" name="workerId" value={worker.data.id} />
          <input type="hidden" name="venueId" value={worker.data.venue_id} />

          <fieldset>
            <legend className="text-sm font-medium">Choose an amount</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {amounts.map(([value, label]) => (
                <label
                  key={value}
                  className="cursor-pointer rounded-xl bg-white py-3 text-center text-lg font-semibold ring-1 ring-ink/15 transition has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral"
                >
                  <input type="radio" name="amountPence" value={value} defaultChecked={value === "500"} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Add a note <span className="font-normal text-ink/50">(optional)</span>
            </span>
            <textarea
              name="message"
              maxLength={280}
              rows={3}
              placeholder={`What did ${worker.data.display_name} do that made your day?`}
              className="rounded-xl border border-ink/15 bg-white px-4 py-3 outline-none focus:border-ink/40"
            />
          </label>

          <button className="rounded-full bg-coral px-5 py-4 text-lg font-semibold text-ink transition hover:bg-[#ff8a77]">
            Continue to payment
          </button>
          <p className="-mt-2 text-center text-sm text-ink/50">Secure checkout with Stripe · No account needed</p>
        </form>
      </section>
    </PublicShell>
  );
}
