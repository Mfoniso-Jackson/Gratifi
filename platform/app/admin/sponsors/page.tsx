import Link from "next/link";
import { AdminShell } from "@/components/Shell";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { sponsorsEnabled } from "@/lib/features";
import { createServiceClient } from "@/lib/supabase/server";
import { attachDreamToCampaign, createCampaign, createDream, createSponsor, setCampaignStatus, withdrawDream } from "./actions";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
const input = "rounded-md border border-ink/15 bg-white px-3 py-2";

export default async function SponsorsPage() {
  await requireGlobalAdmin();
  const db = createServiceClient();
  const [sponsors, campaigns, dreams, workers, venues] = await Promise.all([
    db.from("sponsors").select("*").order("name"),
    db.from("sponsor_campaigns").select("*").order("created_at", { ascending: false }),
    db.from("worker_dreams").select("*, workers(display_name)").order("created_at", { ascending: false }),
    db.from("workers").select("id, display_name, venues(name)").eq("status", "active").order("display_name"),
    db.from("venues").select("id, name").eq("status", "active").order("name")
  ]);
  const sponsorRows = (sponsors.data ?? []) as any[];
  const campaignRows = (campaigns.data ?? []) as any[];
  const sponsorName = (id: string) => sponsorRows.find((s) => s.id === id)?.name ?? "Unknown sponsor";

  return (
    <AdminShell>
      <h1 className="text-3xl font-bold">Sponsors and dreams</h1>
      {!sponsorsEnabled() && (
        <p className="mt-4 rounded-xl border border-ink/10 bg-[#fff6e5] px-4 py-3 text-sm">
          <strong>Switched off.</strong> Customers see no dreams or sponsors until <code>GRATIFI_SPONSORS_ENABLED=true</code> is
          set, which should wait for legal and tax sign-off. You can still set things up here.
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Sponsors</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {sponsorRows.map((sponsor) => (
            <Link key={sponsor.id} href={`/admin/sponsors/${sponsor.id}`} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-4 hover:border-ink/30">
              {sponsor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sponsor.logo_url} alt="" className="h-10 w-14 rounded object-contain" />
              ) : (
                <span className="flex h-10 w-14 items-center justify-center rounded border border-dashed border-ink/30 text-[10px] text-ink/40">LOGO</span>
              )}
              <div>
                <p className="font-semibold">{sponsor.name}</p>
                <p className="text-sm text-ink/60">{campaignRows.filter((c) => c.sponsor_id === sponsor.id).length} campaigns · View report ›</p>
              </div>
            </Link>
          ))}
        </div>
        <form action={createSponsor} className="mt-3 grid gap-3 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <label className="grid gap-1 text-sm">Name<input id="sponsor-name" name="name" required className={input} /></label>
          <label className="grid gap-1 text-sm">Website (https)<input id="sponsor-website" name="website" type="url" className={input} /></label>
          <label className="grid gap-1 text-sm">Logo (PNG, JPEG or WebP, max 500 KB)<input id="sponsor-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" /></label>
          <button className="rounded-md bg-ink px-4 py-2 text-white">Add sponsor</button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-[#eef4f1]"><tr>{["Campaign", "Sponsor", "Mode", "Fund", "Left", "Status", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {campaignRows.map((c) => (
                <tr key={c.id} className="border-t border-ink/10 tabular-nums">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{sponsorName(c.sponsor_id)}</td>
                  <td className="p-3">{c.mode}</td>
                  <td className="p-3">{pounds(c.fund_pence)}</td>
                  <td className="p-3">{pounds(Math.max(0, c.fund_pence - c.fund_spent_pence))}</td>
                  <td className="p-3">{c.status}</td>
                  <td className="p-3">
                    <form action={setCampaignStatus} className="flex gap-2">
                      <input type="hidden" name="campaignId" value={c.id} />
                      {c.status !== "live" && <button name="status" value="live" className="underline">Go live</button>}
                      {c.status === "live" && <button name="status" value="ended" className="underline">End</button>}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form action={createCampaign} className="mt-3 grid gap-3 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-4 md:items-end">
          <label className="grid gap-1 text-sm">Sponsor
            <select id="campaign-sponsor" name="sponsorId" required className={input}>{sponsorRows.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </label>
          <label className="grid gap-1 text-sm">Campaign name<input id="campaign-name" name="name" required className={input} /></label>
          <label className="grid gap-1 text-sm">Mode
            <select id="campaign-mode" name="mode" className={input}><option value="match">Match tips</option><option value="milestone">Milestone</option><option value="grant">Grant</option></select>
          </label>
          <label className="grid gap-1 text-sm">Status
            <select id="campaign-status" name="status" className={input}><option value="draft">Draft</option><option value="live">Live</option></select>
          </label>
          <label className="grid gap-1 text-sm">Fund (£)<input id="campaign-fund" name="fund" inputMode="decimal" required className={input} /></label>
          <label className="grid gap-1 text-sm">Placement fee (£/month)<input id="campaign-fee" name="placementFee" inputMode="decimal" className={input} /></label>
          <label className="grid gap-1 text-sm">Starts<input id="campaign-start" name="startsOn" type="date" className={input} /></label>
          <label className="grid gap-1 text-sm">Ends<input id="campaign-end" name="endsOn" type="date" className={input} /></label>
          <fieldset className="md:col-span-3">
            <legend className="text-sm">Venues</legend>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              {((venues.data ?? []) as any[]).map((v) => (
                <label key={v.id} className="flex items-center gap-1.5"><input type="checkbox" name="venueIds" value={v.id} />{v.name}</label>
              ))}
            </div>
          </fieldset>
          <button className="rounded-md bg-ink px-4 py-2 text-white">Add campaign</button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Staff dreams</h2>
        <div className="mt-3 grid gap-3">
          {((dreams.data ?? []) as any[]).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-white p-4">
              <div>
                <p className="font-semibold">{d.title} <span className="font-normal text-ink/60">· {d.workers?.display_name}</span></p>
                <p className="text-sm tabular-nums text-ink/60">
                  {pounds(d.funded_pence)} of {pounds(d.target_pence)} · {d.status === "pending" ? "waiting for manager approval" : d.status}{d.proposed_by === "staff" ? " · proposed by staff" : ""}
                  {d.sponsor_campaign_id ? ` · ${campaignRows.find((c) => c.id === d.sponsor_campaign_id)?.name ?? "campaign"}` : " · no sponsor"}
                </p>
              </div>
              {["active", "funded"].includes(d.status) && (
                <form action={attachDreamToCampaign} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="dreamId" value={d.id} />
                  <select id={`attach-${d.id}`} name="campaignId" defaultValue={d.sponsor_campaign_id ?? ""} aria-label="Sponsor campaign" className="rounded-md border border-ink/15 bg-white px-2 py-1">
                    <option value="">No sponsor</option>
                    {campaignRows.filter((c) => c.status !== "ended").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button className="underline">Save</button>
                </form>
              )}
              {d.status !== "withdrawn" && (
                <form action={withdrawDream}>
                  <input type="hidden" name="dreamId" value={d.id} />
                  <button className="text-sm text-ink/60 underline">Withdraw</button>
                </form>
              )}
            </div>
          ))}
        </div>
        <form action={createDream} className="mt-3 grid gap-3 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-4 md:items-end">
          <label className="grid gap-1 text-sm">Staff member
            <select id="dream-worker" name="workerId" required className={input}>
              {((workers.data ?? []) as any[]).map((w) => <option key={w.id} value={w.id}>{w.display_name}{w.venues?.name ? ` (${w.venues.name})` : ""}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Dream<input id="dream-title" name="title" required placeholder="Level 2 barista course" className={input} /></label>
          <label className="grid gap-1 text-sm">Costs (£)<input id="dream-target" name="target" inputMode="decimal" required className={input} /></label>
          <label className="grid gap-1 text-sm">Sponsor campaign
            <select id="dream-campaign" name="campaignId" className={input}>
              <option value="">None</option>
              {campaignRows.filter((c) => c.status !== "ended").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm md:col-span-3">Their words (they approve this before it shows)<input id="dream-story" name="story" className={input} /></label>
          <button className="rounded-md bg-ink px-4 py-2 text-white">Add dream</button>
        </form>
      </section>
    </AdminShell>
  );
}
