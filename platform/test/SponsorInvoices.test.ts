import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { sendSponsorInvoice, validateInvoice } from "@/lib/sponsors/InvoiceService";
import { handleStripeEvent } from "@/lib/services/StripeWebhookHandler";

const SPONSOR = "de30f007-0000-4000-8000-000000000001";

function fakeStripe() {
  const calls: string[] = [];
  const stripe = {
    customers: { create: vi.fn(async () => { calls.push("customer"); return { id: "cus_brand" }; }) },
    invoices: {
      create: vi.fn(async () => { calls.push("invoice"); return { id: "in_1" }; }),
      finalizeInvoice: vi.fn(async () => { calls.push("finalize"); return { id: "in_1", hosted_invoice_url: "https://invoice.stripe.com/i/x" }; }),
      sendInvoice: vi.fn(async () => { calls.push("send"); return { id: "in_1" }; })
    },
    invoiceItems: { create: vi.fn(async () => { calls.push("item"); return { id: "ii_1" }; }) }
  };
  return { stripe: stripe as unknown as Stripe, calls, raw: stripe };
}

describe("brand billing", () => {
  beforeEach(() => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
  });

  const sponsor = { id: SPONSOR, name: "Your Brand Here", billing_email: "accounts@brand.example", stripe_customer_id: null };

  it("checks invoices before sending", () => {
    expect(validateInvoice({ sponsor: { ...sponsor, billing_email: null }, campaignId: null, amountPence: 250000, description: "Fee", daysUntilDue: 14 })).toMatch(/billing email/);
    expect(validateInvoice({ sponsor, campaignId: null, amountPence: 50, description: "Fee", daysUntilDue: 14 })).toMatch(/at least/);
    expect(validateInvoice({ sponsor, campaignId: null, amountPence: 250000, description: "Fee", daysUntilDue: 14 })).toBeNull();
  });

  it("creates the customer once, then builds, finalises and emails the invoice", async () => {
    const db = createDemoClient({ env: {} });
    const { stripe, calls, raw } = fakeStripe();
    const saved = await sendSponsorInvoice(stripe, db, { sponsor, campaignId: null, amountPence: 250000, description: "Placement fee", daysUntilDue: 14 });
    expect(calls).toEqual(["customer", "invoice", "item", "finalize", "send"]);
    expect((raw.invoices.create.mock.calls as unknown as unknown[][])[0][0]).toMatchObject({ collection_method: "send_invoice", metadata: { kind: "sponsor_invoice", sponsorId: SPONSOR } });
    expect(saved).toMatchObject({ status: "open", amount_pence: 250000, hosted_invoice_url: "https://invoice.stripe.com/i/x" });
    expect((await db.from("sponsors").select("*").eq("id", SPONSOR).single()).data.stripe_customer_id).toBe("cus_brand");
  });

  it("marks sponsor invoices paid from webhooks and ignores venue subscription invoices", async () => {
    const db = createDemoClient({ env: {} });
    await db.from("sponsor_invoices").insert({ sponsor_id: SPONSOR, description: "Fee", amount_pence: 250000, stripe_invoice_id: "in_9", status: "open" });
    const deps = { db, createRecognition: async () => ({}) };
    const send = (metadata: Record<string, string>) =>
      handleStripeEvent({ id: "evt", object: "event", type: "invoice.paid", data: { object: { id: "in_9", metadata } } } as unknown as Stripe.Event, deps);

    expect((await send({})).action).toBe("ignored");
    expect((await send({ kind: "sponsor_invoice" })).action).toBe("sponsor_invoice_updated");
    expect((await db.from("sponsor_invoices").select("*").eq("stripe_invoice_id", "in_9").single()).data.status).toBe("paid");
  });
});
