// Grants or removes admin-area access (see supabase/migrations/003_access_control.sql).
//
//   pnpm grant:access <email> admin                 GratiFi staff: every venue
//   pnpm grant:access <email> owner <venue-slug>    a venue owner: that venue only (repeat for more venues)
//   pnpm grant:access <email> revoke                remove all access
//
// The person must already have an account (Supabase Auth). Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";

const [email, action, venueSlug] = process.argv.slice(2);
const usage = "Usage: pnpm grant:access <email> admin | owner <venue-slug> | revoke";

if (!email || !["admin", "owner", "revoke"].includes(action) || (action === "owner" && !venueSlug)) {
  console.error(usage);
  process.exit(1);
}
for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function findUserId(address) {
  for (let page = 1; page <= 50; page += 1) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    const match = result.data.users.find((user) => user.email?.toLowerCase() === address.toLowerCase());
    if (match) return match.id;
    if (result.data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  const userId = await findUserId(email);
  if (!userId) throw new Error(`No account found for ${email}. Ask them to sign up first, or create one in Supabase Auth.`);

  if (action === "revoke") {
    await supabase.from("venue_members").delete().eq("user_id", userId);
    const removed = await supabase.from("admin_users").delete().eq("user_id", userId);
    if (removed.error) throw removed.error;
    console.log(`Removed all access for ${email}.`);
    return;
  }

  if (action === "admin") {
    const result = await supabase.from("admin_users").upsert({ user_id: userId, role: "admin" });
    if (result.error) throw result.error;
    console.log(`${email} is now a GratiFi admin (every venue).`);
    return;
  }

  const venue = await supabase.from("venues").select("id, name").eq("slug", venueSlug).maybeSingle();
  if (venue.error) throw venue.error;
  if (!venue.data) throw new Error(`No venue with slug "${venueSlug}".`);

  const existing = await supabase.from("admin_users").select("role").eq("user_id", userId).maybeSingle();
  if (existing.data?.role === "admin") {
    console.log(`${email} is already an admin and can see every venue.`);
    return;
  }
  const role = await supabase.from("admin_users").upsert({ user_id: userId, role: "venue_owner" });
  if (role.error) throw role.error;
  const member = await supabase.from("venue_members").upsert({ user_id: userId, venue_id: venue.data.id });
  if (member.error) throw member.error;
  console.log(`${email} can now manage ${venue.data.name}.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
