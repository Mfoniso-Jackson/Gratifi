import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests: build the app, start it in demo mode (sample data, no Supabase, Stripe or
 * Moonbeam), and click through the main flows. Tests share one server and run in order.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next build && pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      GRATIFI_DEMO_MODE: "true",
      NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`,
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: ""
    }
  }
});
