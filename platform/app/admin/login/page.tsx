import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f2] px-5 text-ink">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="GratiFi home" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Venue sign in</h1>
          <p className="mt-1 text-sm text-ink/60">See your team's recognitions, QR codes and pilot progress.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
