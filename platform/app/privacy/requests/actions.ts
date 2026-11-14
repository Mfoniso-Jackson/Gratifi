"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/services/rateLimit";
import { dueDate, newReference, readDataRequest, type DataRequestErrors } from "@/lib/services/DataRequestService";

export interface DataRequestState {
  errors: DataRequestErrors;
  reference: string | null;
  dueOn: string | null;
}

export async function submitDataRequest(_previous: DataRequestState, formData: FormData): Promise<DataRequestState> {
  const { input, errors } = readDataRequest(formData);
  if (Object.keys(errors).length > 0) return { errors, reference: null, dueOn: null };
  if (!(await rateLimit(`data-request:${clientKey(await headers())}`, 3, 60 * 60 * 1000))) {
    return { errors: { form: "Too many requests from this connection. Try again in an hour, or email us." }, reference: null, dueOn: null };
  }
  const reference = newReference();
  const dueOn = dueDate(new Date());
  const result = await createServiceClient().from("data_requests").insert({
    reference,
    requester_type: input.requesterType,
    request_type: input.requestType,
    email: input.email,
    name: input.name,
    venue_name: input.venueName,
    tip_date: input.tipDate,
    amount_pence: input.amountPence,
    details: input.details,
    status: "received",
    due_on: dueOn
  });
  if (result.error) return { errors: { form: "We couldn't save your request. Please try again." }, reference: null, dueOn: null };
  return { errors: {}, reference, dueOn };
}
