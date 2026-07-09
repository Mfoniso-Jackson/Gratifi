import Link from "next/link";
import { revalidatePath } from "next/cache";
import { AdminShell, Stat } from "@/components/Shell";
import { createServiceClient } from "@/lib/supabase/server";
import { formatMoney, percent, PilotService, pilotStatuses, venueTypes } from "@/lib/services/PilotService";

export const dynamic = "force-dynamic";

async function updateVenue(formData: FormData) {
  "use server";
  const venueId = String(formData.get("venueId"));
  await new PilotService(createServiceClient()).updateVenueFromForm(venueId, formData);
  revalidatePath(`/admin/pilot/${venueId}`);
  revalidatePath("/admin/pilot");
}

async function updateChecklist(formData: FormData) {
  "use server";
  const venueId = String(formData.get("venueId"));
  await new PilotService(createServiceClient()).updateChecklistFromForm(venueId, formData);
  revalidatePath(`/admin/pilot/${venueId}`);
}

async function updateEvidence(formData: FormData) {
  "use server";
  const venueId = String(formData.get("venueId"));
  await new PilotService(createServiceClient()).upsertEvidenceFromForm(venueId, formData);
  revalidatePath(`/admin/pilot/${venueId}`);
}

export default async function PilotVenuePage({ params }: { params: Promise<{ venueId: string }> }) {
  const { venueId } = await params;
  const profile = await new PilotService(createServiceClient()).getVenueProfile(venueId);
  const { venue, metrics, checklist, evidence } = profile;

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-ink/60">Pilot venue profile</p>
          <h1 className="text-3xl font-bold">{venue.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-md border border-ink/15 bg-white px-4 py-2" href={`/admin/pilot/${venue.id}/staff-script`}>Staff script</Link>
          <Link className="rounded-md border border-ink/15 bg-white px-4 py-2" href={`/admin/pilot/${venue.id}/case-study`}>Case study</Link>
          <a className="rounded-md border border-ink/15 bg-white px-4 py-2" href={`/api/admin/pilot/${venue.id}/summary`}>Summary JSON</a>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Recognition events" value={String(metrics.recognitionCount)} />
        <Stat label="Total tip volume" value={`£${formatMoney(metrics.totalTipPence)}`} />
        <Stat label="Moonbeam confirmed" value={percent(metrics.moonbeamConfirmationRate)} />
        <Stat label="Stripe success" value={percent(metrics.stripeSuccessRate)} />
      </div>

      <form action={updateVenue} className="mt-6 grid gap-4 rounded-md border border-ink/10 bg-white p-5">
        <input type="hidden" name="venueId" value={venue.id} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field name="contact_name" label="Contact name" value={venue.contact_name} />
          <Field name="contact_email" label="Contact email" value={venue.contact_email} />
          <Field name="contact_phone" label="Contact phone" value={venue.contact_phone} />
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Venue type</span>
            <select name="venue_type" defaultValue={venue.venue_type ?? "other"} className="rounded-md border border-ink/15 px-3 py-2">
              {venueTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Pilot status</span>
            <select name="pilot_status" defaultValue={venue.pilot_status ?? "prospect"} className="rounded-md border border-ink/15 px-3 py-2">
              {pilotStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <Field name="pilot_start_date" label="Start date" type="date" value={venue.pilot_start_date} />
          <Field name="pilot_end_date" label="End date" type="date" value={venue.pilot_end_date} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field name="referral_source" label="Referral source" value={venue.referral_source} />
          <Field name="follow_up_date" label="Follow-up date" type="date" value={venue.follow_up_date} />
        </div>
        <Textarea name="qr_placement_notes" label="QR placement notes" value={venue.qr_placement_notes} />
        <label className="flex items-center gap-2 text-sm">
          <input name="staff_training_completed" type="checkbox" defaultChecked={Boolean(venue.staff_training_completed)} />
          Staff training completed
        </label>
        <div className="grid gap-3 md:grid-cols-3">
          <Textarea name="owner_feedback" label="Owner feedback" value={venue.owner_feedback} />
          <Textarea name="staff_feedback" label="Staff feedback" value={venue.staff_feedback} />
          <Textarea name="customer_feedback" label="Customer feedback" value={venue.customer_feedback} />
        </div>
        <button className="w-fit rounded-md bg-ink px-4 py-2 text-white">Save pilot profile</button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={updateChecklist} className="rounded-md border border-ink/10 bg-white p-5">
          <input type="hidden" name="venueId" value={venue.id} />
          <h2 className="text-xl font-semibold">QR deployment checklist</h2>
          <div className="mt-4 grid gap-3">
            {checklist.map((item: any) => (
              <label key={item.id} className="flex items-center gap-3 rounded-md border border-ink/10 p-3 text-sm">
                <input name="completed" type="checkbox" value={item.item_key} defaultChecked={item.completed} />
                {item.label}
              </label>
            ))}
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-white">Save checklist</button>
        </form>

        <form action={updateEvidence} className="rounded-md border border-ink/10 bg-white p-5">
          <input type="hidden" name="venueId" value={venue.id} />
          <h2 className="text-xl font-semibold">Pilot evidence capture</h2>
          <div className="mt-4 grid gap-3">
            <Textarea name="testimonial_text" label="Testimonial text" value={evidence?.testimonial_text} />
            <Textarea name="feedback_notes" label="Feedback notes" value={evidence?.feedback_notes} />
            <Field name="qr_placement_photo_url" label="QR placement photo URL" value={evidence?.qr_placement_photo_url} />
            <Field name="screenshot_url" label="Screenshot URL" value={evidence?.screenshot_url} />
            <Textarea name="case_study_notes" label="Case study notes" value={evidence?.case_study_notes} />
            <label className="flex items-center gap-2 text-sm">
              <input name="permission_to_use_quote" type="checkbox" defaultChecked={Boolean(evidence?.permission_to_use_quote)} />
              Permission to use quote
            </label>
          </div>
          <button className="mt-4 rounded-md bg-ink px-4 py-2 text-white">Save evidence</button>
        </form>
      </div>
    </AdminShell>
  );
}

function Field({ name, label, value, type = "text" }: { name: string; label: string; value?: string | null; type?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input name={name} type={type} defaultValue={value ?? ""} className="rounded-md border border-ink/15 px-3 py-2" />
    </label>
  );
}

function Textarea({ name, label, value }: { name: string; label: string; value?: string | null }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <textarea name={name} defaultValue={value ?? ""} rows={4} className="rounded-md border border-ink/15 px-3 py-2" />
    </label>
  );
}
