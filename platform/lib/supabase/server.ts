import { createClient } from "@supabase/supabase-js";
import { createDemoClient } from "@/lib/demo/client";
import { isDemoMode } from "@/lib/demo/mode";

export function createServiceClient() {
  if (isDemoMode()) return createDemoClient() as unknown as ReturnType<typeof createClient>;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase service credentials are not configured.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export function createAnonClient() {
  if (isDemoMode()) return createDemoClient() as unknown as ReturnType<typeof createClient>;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase public credentials are not configured.");
  }

  return createClient(url, key);
}
