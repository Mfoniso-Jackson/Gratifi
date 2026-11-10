/**
 * Demo mode serves the whole app from an in-memory sample dataset instead of
 * Supabase, Stripe and Moonbeam. It exists so the product can be previewed
 * without any credentials.
 *
 * Enable with GRATIFI_DEMO_MODE=true. Never enable it on a real deployment:
 * admin pages are open in demo mode and payments are simulated.
 */
export function isDemoMode() {
  return process.env.GRATIFI_DEMO_MODE === "true";
}
