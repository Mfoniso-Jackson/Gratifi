import { isDemoMode } from "@/lib/demo/mode";

/**
 * Sponsors and the Dream Fund are built but switched off until legal and tax advice confirms
 * dream-linked tips and brand-funded dreams are allowed. Turn on with GRATIFI_SPONSORS_ENABLED=true.
 * Demo mode always shows them, so they can be pitched to brands.
 */
export function sponsorsEnabled(env: Record<string, string | undefined> = process.env) {
  return isDemoMode(env) || env.GRATIFI_SPONSORS_ENABLED === "true";
}
