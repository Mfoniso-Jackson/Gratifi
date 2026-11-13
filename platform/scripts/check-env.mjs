const groups = {
  app: ["NEXT_PUBLIC_APP_URL"],
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  chain: ["CHAIN_ID", "CHAIN_OPERATOR_PRIVATE_KEY", "GRATIFI_PROTOCOL_CONTRACT_ADDRESS"],
  limits: ["MIN_TIP_AMOUNT_PENCE", "MAX_TIP_AMOUNT_PENCE"]
};

let hasMissing = false;

for (const [group, keys] of Object.entries(groups)) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    hasMissing = true;
    console.log(`${group}: missing ${missing.join(", ")}`);
  } else {
    console.log(`${group}: ok`);
  }
}

const oldMoonbeam = ["MOONBEAM_RPC_URL", "MOONBEAM_CHAIN_ID", "MOONBEAM_OPERATOR_PRIVATE_KEY"].filter((key) => process.env[key]);
if (oldMoonbeam.length > 0) {
  console.log(`chain: ${oldMoonbeam.join(", ")} are no longer used (Moonbeam shut down). Use CHAIN_ID, CHAIN_RPC_URL and CHAIN_OPERATOR_PRIVATE_KEY.`);
}
if (["1284", "1287"].includes(process.env.CHAIN_ID ?? "")) {
  hasMissing = true;
  console.log("chain: CHAIN_ID points at Moonbeam, which has shut down. Use 8453 (Base) or 84532 (Base Sepolia).");
}

if (process.env.GRATIFI_DEMO_MODE === "true") {
  hasMissing = true;
  console.log("demo: GRATIFI_DEMO_MODE is true; turn it off before deploying (admin pages are open in demo mode)");
}

if (hasMissing) process.exit(1);
