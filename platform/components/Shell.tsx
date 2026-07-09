import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-xl font-bold tracking-normal">GratiFi</Link>
        <Link href="/admin" className="rounded-md border border-ink/15 px-3 py-2 text-sm">Admin</Link>
      </header>
      {children}
    </main>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const links = [
    ["/admin", "Overview"],
    ["/admin/pilot", "Pilot"],
    ["/admin/venues", "Venues"],
    ["/admin/workers", "Workers"],
    ["/admin/events", "Events"],
    ["/admin/protocol", "Protocol"]
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-ink">
      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:grid-cols-[220px_1fr]">
        <aside className="md:sticky md:top-6 md:h-[calc(100vh-48px)]">
          <Link href="/" className="block text-2xl font-bold">GratiFi</Link>
          <nav className="mt-6 grid gap-2">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm hover:bg-white">{label}</Link>
            ))}
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
