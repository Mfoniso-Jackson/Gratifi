import { notFound } from "next/navigation";
import { AdminShell, Stat } from "@/components/Shell";
import { requireGlobalAdmin } from "@/lib/auth/access";
import { createServiceClient } from "@/lib/supabase/server";
import { campaignReport } from "@/lib/sponsors/SponsorService";
import { replaceLogo, sendInvoice, setBillingEmail } from "../actions";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function SponsorReportPage({ params }: { params: Promise<{ sponsorId: string }> }) {
  await requireGlobalAdmin();
  const { sponsorId } = await params;
  const db = createServiceClient();
  const sponsor = (await db.from("sponsors").select("*").eq("id", sponsorId).maybeSingle()).data as any;
  if (!sponsor) notFound();
  const campaigns = ((await db.from("sponsor_campaigns").select("*").eq("sponsor_id", sponsorId)).data ?? []) as any[];
  const reports = await Promise.all(campaigns.map((c) => campaignReport(db, c)));
  const invoices = ((await db.from("sponsor_invoices").select("*").eq("sponsor_id", sponsorId).order("created_at", { ascending: false })).data ?? []) as any[];
  const outstanding = invoices.filter((i) => i.status === "open").reduce((sum, i) => sum + i.amount_pence, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount_pence, 0);
  const firstLive = campaigns.find((c) => c.status === "live") ?? campaigns.at(0);
  const month = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {sponsor.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sponsor.logo_url} alt="" className="h-12 w-16 rounded object-contain" />
          )}
          <div>
            <p className="text-sm text-ink/60">Brand report</p>
            <h1 className="text-3xl font-bold">{sponsor.name}</h1>
          </div>
        </div>
        <a href={`/api/admin/sponsors/${sponsor.id}/report`} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">Download CSV</a>
      </div>

      {reports.length === 0 && <p className="mt-6 text-ink/70">No campaigns yet.</p>}
      {reports.map((r) => (
        <section key={r.campaign_id} className="mt-8">
          <h2 className="text-xl font-semibold">{r.campaign_name} <span className="text-sm font-normal text-ink/60">· {r.status} · {r.venues} venues</span></h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Times shown" value={String(r.views)} />
            <Stat label="Dream-linked tips" value={String(r.dream_linked_tips)} />
            <Stat label="Matched by the brand" value={pounds(r.brand_matched_pence)} />
            <Stat label="Given by customers" value={pounds(r.customer_to_dreams_pence)} />
            <Stat label="Fund left" value={`${pounds(r.fund_left_pence)} of ${pounds(r.fund_pence)}`} />
            <Stat label="Dreams" value={String(r.dreams)} />
            <Stat label="Dreams completed" value={String(r.dreams_completed)} />
            <Stat label="Staff reached" value={String(r.staff_reached)} />
          </div>
        </section>
      ))}
      <p className="mt-6 text-sm text-ink/60">Counts only. Individual staff tips and notes are never shared with sponsors.</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Billing</h2>
        <p className="mt-1 text-sm text-ink/60">
          Placement fees are invoiced through Stripe, which emails the invoice and takes payment. Dream fund money isn&apos;t invoiced here
          until the payments advice is in.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Stat label="Outstanding" value={pounds(outstanding)} />
          <Stat label="Paid" value={pounds(paid)} />
        </div>

        <form action={setBillingEmail} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4">
          <input type="hidden" name="sponsorId" value={sponsor.id} />
          <label className="grid gap-1 text-sm">Billing email
            <input id="billing-email" name="billingEmail" type="email" required defaultValue={sponsor.billing_email ?? ""} className="rounded-md border border-ink/15 px-3 py-2" />
          </label>
          <button className="rounded-md border border-ink/15 px-4 py-2">Save</button>
        </form>

        <form action={sendInvoice} className="mt-3 grid gap-3 rounded-xl border border-ink/10 bg-white p-4 md:grid-cols-[1fr_1fr_2fr_auto_auto] md:items-end">
          <input type="hidden" name="sponsorId" value={sponsor.id} />
          <label className="grid gap-1 text-sm">Campaign
            <select id="invoice-campaign" name="campaignId" defaultValue={firstLive?.id ?? ""} className="rounded-md border border-ink/15 bg-white px-3 py-2">
              <option value="">None</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Amount (£)
            <input id="invoice-amount" name="amount" inputMode="decimal" required defaultValue={firstLive?.placement_fee_pence ? (firstLive.placement_fee_pence / 100).toFixed(2) : ""} className="rounded-md border border-ink/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">Description
            <input id="invoice-description" name="description" required defaultValue={`GratiFi placement fee: ${firstLive?.name ?? "campaign"}, ${month}`} className="rounded-md border border-ink/15 px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">Due in
            <select id="invoice-due" name="daysUntilDue" defaultValue="14" className="rounded-md border border-ink/15 bg-white px-3 py-2">
              <option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
            </select>
          </label>
          <button disabled={!sponsor.billing_email} className="rounded-md bg-ink px-4 py-2 text-white disabled:opacity-50">Send invoice</button>
        </form>
        {!sponsor.billing_email && <p className="mt-2 text-sm text-ink/60">Add a billing email to send invoices.</p>}

        <div className="mt-3 overflow-x-auto rounded-xl border border-ink/10 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-[#eef4f1]"><tr>{["Sent", "Description", "Amount", "Due", "Status", ""].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {invoices.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink/60">No invoices yet.</td></tr>}
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-ink/10 tabular-nums">
                  <td className="p-3">{new Date(invoice.created_at).toLocaleDateString("en-GB")}</td>
                  <td className="p-3">{invoice.description}</td>
                  <td className="p-3">{pounds(invoice.amount_pence)}</td>
                  <td className="p-3">{invoice.due_on ? new Date(invoice.due_on).toLocaleDateString("en-GB") : "—"}</td>
                  <td className="p-3">
                    {invoice.status === "paid" ? <StatusPill tone="good">Paid</StatusPill>
                      : invoice.status === "open" && invoice.due_on && invoice.due_on < today ? <StatusPill tone="bad">Overdue</StatusPill>
                      : invoice.status === "open" ? <StatusPill tone="warn">Awaiting payment</StatusPill>
                      : <StatusPill tone="neutral">{invoice.status}</StatusPill>}
                  </td>
                  <td className="p-3">{invoice.hosted_invoice_url && <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="underline">View</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form action={replaceLogo} className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-ink/10 bg-white p-4">
        <input type="hidden" name="sponsorId" value={sponsor.id} />
        <label className="grid gap-1 text-sm">Replace logo (PNG, JPEG or WebP, max 500 KB)
          <input id="replace-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
        </label>
        <button className="rounded-md border border-ink/15 px-4 py-2">Upload</button>
      </form>
    </AdminShell>
  );
}
