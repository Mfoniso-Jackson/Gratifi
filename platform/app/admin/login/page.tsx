import { AdminShell } from "@/components/Shell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AdminShell>
      <div className="max-w-md rounded-md border border-ink/10 bg-white p-6">
        <h1 className="text-3xl font-bold">Admin login</h1>
        <LoginForm />
      </div>
    </AdminShell>
  );
}
