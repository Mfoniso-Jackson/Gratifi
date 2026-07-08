import { PublicShell } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { WorkerService } from "@/lib/services/WorkerService";

export const dynamic = "force-dynamic";

export default async function TipPage({ params }: { params: Promise<{ workerId: string }> }) {
  const { workerId } = await params;
  const db = createServiceClient();
  const worker = await new WorkerService(db).get(workerId);
  if (worker.error) throw new Error("Worker not found");

  return (
    <PublicShell>
      <section className="mx-auto max-w-xl px-5 py-10">
        <p className="text-sm text-ink/60">{worker.data.venues.name}</p>
        <h1 className="mt-2 text-4xl font-bold">Recognise {worker.data.display_name}</h1>
        <form action="/api/v1/recognitions" method="post" className="mt-8 grid gap-4 rounded-md border border-ink/10 bg-white p-5">
          <input type="hidden" name="workerId" value={worker.data.id} />
          <input type="hidden" name="venueId" value={worker.data.venue_id} />
          <label className="grid gap-2">
            <span className="text-sm font-medium">Amount</span>
            <select name="amountPence" className="rounded-md border border-ink/15 px-3 py-3">
              <option value="300">£3</option>
              <option value="500">£5</option>
              <option value="1000">£10</option>
              <option value="2000">£20</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Thank-you message</span>
            <textarea name="message" maxLength={280} rows={4} className="rounded-md border border-ink/15 px-3 py-3" />
          </label>
          <button className="rounded-md bg-ink px-5 py-3 font-semibold text-white">Continue to payment</button>
        </form>
      </section>
    </PublicShell>
  );
}
