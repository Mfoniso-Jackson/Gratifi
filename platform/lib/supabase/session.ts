import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** A Supabase client acting as the signed-in user, from the request's auth cookies (server components and routes). */
export async function createSessionClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
        // Server components cannot set cookies; the middleware refreshes the session instead.
        try {
          cookiesToSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      }
    }
  });
}
