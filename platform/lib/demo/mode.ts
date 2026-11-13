/**
 * Demo mode serves the whole app from an in-memory sample dataset instead of
 * Supabase, Stripe and Moonbeam. It exists so the product can be previewed
 * without any credentials.
 *
 * Enable with GRATIFI_DEMO_MODE=true. Admin pages are open and payments are
 * simulated in demo mode, so it is refused on a production deployment
 * (VERCEL_ENV=production) even if the flag is set.
 */
let warned = false;

export function isDemoMode(env: Record<string, string | undefined> = process.env) {
  if (env.GRATIFI_DEMO_MODE !== "true") return false;
  if (env.VERCEL_ENV === "production") {
    if (!warned) {
      console.error("GRATIFI_DEMO_MODE is set on a production deployment and has been ignored.");
      warned = true;
    }
    return false;
  }
  return true;
}
