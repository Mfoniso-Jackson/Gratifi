const groups = {
  app: ["NEXT_PUBLIC_APP_URL"],
  supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  moonbeam: ["MOONBEAM_RPC_URL", "MOONBEAM_CHAIN_ID", "MOONBEAM_OPERATOR_PRIVATE_KEY", "GRATIFI_PROTOCOL_CONTRACT_ADDRESS"],
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

if (hasMissing) process.exit(1);
