"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const supabase = createBrowserSupabaseClient();
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4">
      <input name="email" className="rounded-md border border-ink/15 px-3 py-3" placeholder="Email" type="email" required />
      <input name="password" className="rounded-md border border-ink/15 px-3 py-3" placeholder="Password" type="password" required />
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      <button className="rounded-md bg-ink px-5 py-3 text-white">Sign in</button>
    </form>
  );
}
