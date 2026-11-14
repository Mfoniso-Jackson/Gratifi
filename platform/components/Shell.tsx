import Link from "next/link";
import { Logo } from "@/components/Logo";
import { isDemoMode } from "@/lib/demo/mode";
import { getAdminContext, type AdminContext } from "@/lib/auth/access";
import { loadVenueAccess } from "@/lib/billing/access";
import { createServiceClient } from "@/lib/supabase/server";
import { sponsorsEnabled } from "@/lib/features";

function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-ink px-5 py-2 text-center text-xs text-white/80">
      Demo mode — sample data only. No real payments are taken.
    </div>
  );
}

export function PublicShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-ink">
      <DemoBanner />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" aria-label="GratiFi home">
          <Logo />
        </Link>
        {!minimal && (
          <nav className="flex items-center gap-1 text-sm sm:gap-2">
            <Link href="/demo" className="hidden rounded-full px-3 py-2 text-ink/70 hover:text-ink sm:inline-block">
              How it works
            </Link>
            {sponsorsEnabled() && (
              <Link href="/dreams" className="hidden rounded-full px-3 py-2 text-ink/70 hover:text-ink sm:inline-block">
                Dream Wall
              </Link>
            )}
            <Link href="/admin" className="rounded-full border border-ink/15 bg-white px-4 py-2 font-medium hover:border-ink/40">
              Venue sign in
            </Link>
          </nav>
        )}
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mx-auto w-full max-w-6xl px-5 py-8 text-sm text-ink/50">
        <div className="flex flex-col justify-between gap-2 border-t border-ink/10 pt-6 sm:flex-row">
          <span>
            © {new Date().getFullYear()} GratiFi ·{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy</Link> ·{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-ink">Terms</Link> ·{" "}
            <Link href="/privacy/requests" className="underline underline-offset-2 hover:text-ink">Your data</Link>
          </span>
          <span>Payments secured by Stripe. No customer account needed.</span>
        </div>
      </footer>
    </main>
  );
}

/** For venue owners: a reminder when a pilot is nearly over, in its grace period, or paused. */
async function PlanBanner({ context }: { context: AdminContext | null }) {
  if (!context || context.role !== "venue_owner" || !context.venueIds?.length) return null;
  const db = createServiceClient();
  const venues = ((await db.from("venues").select("id, name, created_at, billing_exempt").in("id", context.venueIds)).data ?? []) as any[];
  const notices: Array<{ venue: any; text: string; urgent: boolean }> = [];
  for (const venue of venues) {
    const access = await loadVenueAccess(db, venue);
    const days = `${access.daysLeft} day${access.daysLeft === 1 ? "" : "s"}`;
    if (access.state === "paused") notices.push({ venue, urgent: true, text: `${venue.name} has stopped taking tips because its pilot ended without a plan. Choose a plan to restart straight away.` });
    else if (access.state === "grace") notices.push({ venue, urgent: true, text: `${venue.name}'s pilot has ended. Choose a plan within ${days} to keep taking tips.` });
    else if (access.state === "pilot" && access.daysLeft <= 7) notices.push({ venue, urgent: false, text: `${days} left in ${venue.name}'s free pilot.` });
  }
  if (notices.length === 0) return null;
  return (
    <div className="mb-6 grid gap-2">
      {notices.map(({ venue, text, urgent }) => (
        <Link
          key={venue.id}
          href={`/admin/billing?venueId=${venue.id}`}
          className={`rounded-xl px-4 py-3 text-sm ${urgent ? "bg-coral/15 text-[#8f2e1f]" : "bg-[#fff6e5] text-ink"}`}
        >
          {text} <span className="font-semibold underline">Choose a plan</span>
        </Link>
      ))}
    </div>
  );
}

export async function AdminShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  const context = await getAdminContext();
  const isAdmin = context?.role === "admin";
  // Pilot tools and protocol status are for GratiFi staff; venue owners see their own venues only.
  const links = [
    ["/admin", "Overview", true],
    ["/admin/pilot", "Pilot", isAdmin],
    ["/admin/sponsors", "Sponsors", isAdmin],
    ["/admin/venues", isAdmin ? "Venues" : "My venues", true],
    ["/admin/workers", "Staff", true],
    ["/admin/events", "Tips", true],
    ["/admin/payroll", "Payroll", true],
    ["/admin/billing", "Billing", true],
    ["/admin/protocol", "Protocol", isAdmin],
    ["/admin/data-requests", "Data requests", isAdmin]
  ].filter(([, , visible]) => visible) as Array<[string, string, boolean]>;

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-ink">
      <DemoBanner />
      <div className={`mx-auto grid max-w-7xl grid-cols-1 gap-6 px-5 py-6 ${nav ? "md:grid-cols-[220px_1fr]" : ""}`}>
        <aside className={`min-w-0 ${nav ? "md:sticky md:top-6 md:h-[calc(100vh-48px)]" : ""}`}>
          <Link href="/" aria-label="GratiFi home">
            <Logo />
          </Link>
          {nav && (
            <nav className="mt-6 flex gap-1 overflow-x-auto md:grid md:gap-1">
              {links.map(([href, label]) => (
                <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm hover:bg-white">
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </aside>
        <section className="min-w-0">
          <PlanBanner context={context} />
          {children}
        </section>
      </div>
    </main>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

const avatarColors = ["bg-coral/20 text-[#b33a26]", "bg-mint text-[#1f5c34]", "bg-[#dfe7f5] text-steel", "bg-[#f6e7c8] text-[#7a5310]"];

export function Avatar({
  name,
  photoUrl,
  size = "h-12 w-12 text-lg"
}: {
  name: string;
  photoUrl?: string | null;
  size?: string;
}) {
  if (photoUrl && photoUrl.startsWith("https://")) {
    // Plain <img>: staff photos can be hosted anywhere, so next/image's host allowlist doesn't fit.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="" className={`shrink-0 rounded-full object-cover ${size}`} />;
  }
  const index = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarColors.length;
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${size} ${avatarColors[index]}`}>
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
