import Link from "next/link";
import { PublicShell } from "@/components/Shell";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <PublicShell minimal>
      <section className="mx-auto grid min-h-[50vh] max-w-lg content-center gap-4 px-5 py-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Check your inbox</h1>
        <p className="text-ink/70">
          We&apos;ve sent a confirmation link{email ? ` to ${email}` : ""}. Click it, then sign in to add your team and print
          your QR card.
        </p>
        <Link href="/admin/login" className="mx-auto rounded-full bg-ink px-6 py-3 font-medium text-white">Go to sign in</Link>
      </section>
    </PublicShell>
  );
}
