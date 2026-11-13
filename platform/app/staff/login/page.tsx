import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/app/admin/login/LoginForm";

export default function StaffLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 text-ink">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="GratiFi home" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Staff sign in</h1>
          <p className="mt-1 text-sm text-ink/60">See the tips and thank-you notes customers have left you.</p>
          <LoginForm redirectTo="/staff" />
          <p className="mt-4 text-xs text-ink/50">No account? Ask your manager to invite you from the GratiFi dashboard.</p>
        </div>
      </div>
    </main>
  );
}
