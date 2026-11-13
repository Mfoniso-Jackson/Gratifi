import type Stripe from "stripe";

/**
 * Invoicing sponsors for placement fees through Stripe Invoicing. Stripe emails the invoice and hosts
 * the payment page; invoice.* webhooks keep sponsor_invoices in step.
 *
 * Only placement fees are invoiced here. Dream fund money would mean GratiFi holding money meant for
 * staff, which waits on payments advice.
 */
export interface InvoiceRequest {
  sponsor: { id: string; name: string; billing_email: string | null; stripe_customer_id: string | null };
  campaignId: string | null;
  amountPence: number;
  description: string;
  daysUntilDue: number;
}

export function validateInvoice(request: InvoiceRequest) {
  if (!request.sponsor.billing_email) return "Add a billing email for this sponsor first.";
  if (!Number.isInteger(request.amountPence) || request.amountPence < 100) return "Invoices must be at least £1.";
  if (request.amountPence > 10_000_000) return "That amount looks too large. Check it and try again.";
  if (!request.description.trim()) return "Add a description.";
  if (request.daysUntilDue < 1 || request.daysUntilDue > 90) return "Choose a due date between 1 and 90 days.";
  return null;
}

export function dueOn(daysUntilDue: number, now = new Date()) {
  return new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** Creates, finalises and emails a Stripe invoice, then records it. Creates the Stripe customer if needed. */
export async function sendSponsorInvoice(stripe: Stripe, db: any, request: InvoiceRequest) {
  const problem = validateInvoice(request);
  if (problem) throw new Error(problem);

  let customerId = request.sponsor.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: request.sponsor.name,
      email: request.sponsor.billing_email ?? undefined,
      metadata: { kind: "sponsor", sponsorId: request.sponsor.id }
    });
    customerId = customer.id;
    await db.from("sponsors").update({ stripe_customer_id: customerId }).eq("id", request.sponsor.id);
  }

  const metadata = { kind: "sponsor_invoice", sponsorId: request.sponsor.id, campaignId: request.campaignId ?? "" };
  const draft = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: request.daysUntilDue,
    currency: "gbp",
    description: request.description,
    metadata
  });
  await stripe.invoiceItems.create({ customer: customerId, invoice: draft.id, amount: request.amountPence, currency: "gbp", description: request.description });
  const finalised = await stripe.invoices.finalizeInvoice(draft.id as string);
  await stripe.invoices.sendInvoice(finalised.id as string);

  const saved = await db
    .from("sponsor_invoices")
    .insert({
      sponsor_id: request.sponsor.id,
      campaign_id: request.campaignId,
      description: request.description,
      amount_pence: request.amountPence,
      stripe_invoice_id: finalised.id,
      hosted_invoice_url: finalised.hosted_invoice_url ?? null,
      status: "open",
      due_on: dueOn(request.daysUntilDue)
    })
    .select("*")
    .single();
  if (saved.error) throw saved.error;
  return saved.data;
}

const STATUS_BY_EVENT: Record<string, string> = {
  "invoice.paid": "paid",
  "invoice.voided": "void",
  "invoice.marked_uncollectible": "uncollectible"
};

/** Applies an invoice.* webhook to a sponsor invoice. Returns false for invoices that aren't sponsor invoices. */
export async function applySponsorInvoiceEvent(db: any, eventType: string, invoice: Stripe.Invoice) {
  if (invoice.metadata?.kind !== "sponsor_invoice") return false;
  const status = STATUS_BY_EVENT[eventType];
  if (!status) return false;
  await db
    .from("sponsor_invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null, hosted_invoice_url: invoice.hosted_invoice_url ?? null })
    .eq("stripe_invoice_id", invoice.id);
  return true;
}
