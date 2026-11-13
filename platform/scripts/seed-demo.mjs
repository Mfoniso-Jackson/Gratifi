import { createClient } from "@supabase/supabase-js";

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const venueInput = {
  slug: process.env.DEMO_VENUE_SLUG ?? "demo-cafe",
  name: process.env.DEMO_VENUE_NAME ?? "Demo Cafe",
  address: process.env.DEMO_VENUE_ADDRESS ?? "1 Recognition Street",
  status: "active"
};

const workers = [
  {
    display_name: process.env.DEMO_WORKER_ONE_NAME ?? "Amara",
    role: process.env.DEMO_WORKER_ONE_ROLE ?? "Barista"
  },
  {
    display_name: process.env.DEMO_WORKER_TWO_NAME ?? "Sam",
    role: process.env.DEMO_WORKER_TWO_ROLE ?? "Server"
  }
];

async function main() {
  const venue = await upsertVenue();
  const createdWorkers = [];

  for (const worker of workers) {
    createdWorkers.push(await ensureWorker(venue.id, worker));
  }

  if (process.env.DEMO_ADMIN_EMAIL && process.env.DEMO_ADMIN_PASSWORD) {
    await ensureAdmin(process.env.DEMO_ADMIN_EMAIL, process.env.DEMO_ADMIN_PASSWORD);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  console.log("Seed complete");
  console.log(`Venue: ${venue.name} (${venue.id})`);
  console.log(`Venue page: ${appUrl}/v/${venue.slug}`);
  for (const worker of createdWorkers) {
    console.log(`Worker: ${worker.display_name} (${appUrl}/tip/${worker.id})`);
  }
}

async function upsertVenue() {
  const result = await supabase
    .from("venues")
    .upsert(venueInput, { onConflict: "slug" })
    .select("*")
    .single();

  if (result.error) throw result.error;
  return result.data;
}

async function ensureWorker(venueId, worker) {
  const existing = await supabase
    .from("workers")
    .select("*")
    .eq("venue_id", venueId)
    .eq("display_name", worker.display_name)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await supabase
    .from("workers")
    .insert({
      venue_id: venueId,
      display_name: worker.display_name,
      role: worker.role,
      status: "active"
    })
    .select("*")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

async function ensureAdmin(email, password) {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (created.error && !created.error.message.toLowerCase().includes("already")) {
    throw created.error;
  }

  // Signing in is not enough: the account also needs an admin role (see 003_access_control.sql).
  const userId = created.data?.user?.id ?? (await findUserId(email));
  if (!userId) throw new Error(`Could not find the auth user for ${email}`);
  const role = await supabase.from("admin_users").upsert({ user_id: userId, role: "admin" });
  if (role.error) throw role.error;
}

async function findUserId(email) {
  for (let page = 1; page <= 50; page += 1) {
    const result = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (result.error) throw result.error;
    const match = result.data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (result.data.users.length < 200) return null;
  }
  return null;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
