import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo/mode";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionClient } from "@/lib/supabase/session";

/**
 * Who is using the admin area and what they may see.
 * - admin: GratiFi staff, every venue (venueIds = null).
 * - venue_owner: only the venues in venue_members.
 * Signed-in accounts without an admin_users row have no access.
 */
export type AdminRole = "admin" | "venue_owner";

export interface AdminContext {
  userId: string;
  role: AdminRole;
  /** null means every venue (admins). */
  venueIds: string[] | null;
}

const DEMO_CONTEXT: AdminContext = { userId: "demo-admin", role: "admin", venueIds: null };

/** Looks up a user's role and venues with a service-role client. Returns null when they have no access. */
export async function loadAccess(db: any, userId: string): Promise<AdminContext | null> {
  const access = await db.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (access.error || !access.data) return null;
  const role = access.data.role as AdminRole;
  if (role === "admin") return { userId, role, venueIds: null };
  if (role !== "venue_owner") return null;

  const memberships = await db.from("venue_members").select("venue_id").eq("user_id", userId);
  if (memberships.error) return null;
  return { userId, role, venueIds: (memberships.data ?? []).map((row: { venue_id: string }) => row.venue_id) };
}

/** The current request's admin context, or null when the visitor is not signed in or has no access. */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (isDemoMode()) return DEMO_CONTEXT;
  const session = await createSessionClient();
  const { data } = await session.auth.getUser();
  if (!data.user) return null;
  return loadAccess(createServiceClient(), data.user.id);
});

/** For admin pages and server actions: anyone with access, otherwise back to sign-in. */
export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext();
  if (!context) redirect("/admin/login?error=no-access");
  return context;
}

/** For GratiFi-only pages (pilot tools, protocol, creating venues). Venue owners get a 404. */
export async function requireGlobalAdmin(): Promise<AdminContext> {
  const context = await requireAdmin();
  if (context.role !== "admin") notFound();
  return context;
}

/** For admin API routes: the context, or a 401/403 response to return. */
export async function adminApiAccess(options: { globalOnly?: boolean } = {}): Promise<AdminContext | Response> {
  const context = await getAdminContext();
  if (!context) return Response.json({ error: "Sign in with an account that has access." }, { status: 401 });
  if (options.globalOnly && context.role !== "admin") return Response.json({ error: "Not allowed." }, { status: 403 });
  return context;
}

export function canAccessVenue(context: AdminContext, venueId: string | null | undefined) {
  if (!venueId) return false;
  return context.venueIds === null || context.venueIds.includes(venueId);
}

// Matches no rows: used when an owner has no venues yet, since `.in(column, [])` is not valid.
const NO_VENUE = "00000000-0000-0000-0000-000000000000";

/** Limits a query to the venues this context may see (no-op for admins). */
export function scopeToVenues<Q>(query: Q, context: AdminContext, column = "venue_id"): Q {
  if (context.venueIds === null) return query;
  const values = context.venueIds.length > 0 ? context.venueIds : [NO_VENUE];
  return (query as unknown as { in: (column: string, values: string[]) => Q }).in(column, values);
}
