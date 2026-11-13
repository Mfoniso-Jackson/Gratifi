"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appConfig } from "@/lib/config";
import { isDemoMode } from "@/lib/demo/mode";
import { createAnonClient, createServiceClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/services/rateLimit";
import { createVenueForOwner, readSignup, validateSignup, validReferrer, type SignupErrors } from "@/lib/services/SignupService";

export interface SignupState {
  errors: SignupErrors;
  values: Record<string, string>;
}

export async function signUpVenue(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const input = readSignup(formData);
  const values = { ownerName: input.ownerName, email: input.email, venueName: input.venueName, venueType: input.venueType, address: input.address, referralCode: input.referralCode };
  const errors = validateSignup(input);
  if (Object.keys(errors).length > 0) return { errors, values };

  if (!(await rateLimit(`signup:${clientKey(await headers())}`, 5, 60 * 60 * 1000))) {
    return { errors: { form: "Too many sign-ups from this connection. Try again in an hour." }, values };
  }

  const db = createServiceClient();
  const referredBy = await validReferrer(db, input.referralCode);

  if (isDemoMode()) {
    // Demo mode has no accounts: create the venue and open its dashboard.
    const venue = await createVenueForOwner(db, { userId: "demo-admin", venueName: input.venueName, venueType: input.venueType, address: input.address, referredBy });
    redirect(`/admin/venues/${venue.id}?welcome=1`);
  }

  const signUp = await createAnonClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: `${appConfig.appUrl}/admin`, data: { name: input.ownerName } }
  });
  if (signUp.error) return { errors: { form: signUp.error.message }, values };
  // With email confirmation on, Supabase returns a user with no identities when the email is already registered.
  const user = signUp.data.user;
  if (!user || (user.identities && user.identities.length === 0)) {
    return { errors: { email: "An account with this email already exists. Sign in instead." }, values };
  }

  await createVenueForOwner(db, { userId: user.id, venueName: input.venueName, venueType: input.venueType, address: input.address, referredBy });
  redirect(`/for-venues/welcome?email=${encodeURIComponent(input.email)}`);
}
