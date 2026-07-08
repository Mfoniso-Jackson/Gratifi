import Link from "next/link";
import { PublicShell } from "@/components/Shell";

export default function SuccessPage() {
  return (
    <PublicShell>
      <section className="mx-auto grid min-h-[70vh] max-w-2xl content-center px-5 text-center">
        <p className="text-sm font-semibold text-coral">Recognition complete</p>
        <h1 className="mt-3 text-4xl font-bold">Thank you — your recognition has been permanently recorded.</h1>
        <Link href="/" className="mx-auto mt-8 rounded-md border border-ink/15 px-5 py-3">Done</Link>
      </section>
    </PublicShell>
  );
}
