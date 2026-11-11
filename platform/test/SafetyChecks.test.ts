import { afterEach, describe, expect, it, vi } from "vitest";
import { isDemoMode } from "@/lib/demo/mode";
import { clientKey, rateLimit } from "@/lib/services/rateLimit";
import { isBalanceLow, MoonbeamService } from "@/lib/services/MoonbeamService";
import { appConfig } from "@/lib/config";

describe("demo mode guard", () => {
  it("is off unless the flag is set", () => {
    expect(isDemoMode({})).toBe(false);
    expect(isDemoMode({ GRATIFI_DEMO_MODE: "true" })).toBe(true);
  });

  it("is refused on a production deployment even when the flag is set", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(isDemoMode({ GRATIFI_DEMO_MODE: "true", VERCEL_ENV: "production" })).toBe(false);
    expect(isDemoMode({ GRATIFI_DEMO_MODE: "true", VERCEL_ENV: "preview" })).toBe(true);
  });
});

describe("rate limit", () => {
  const env = { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "token" };

  function fakeRedis() {
    const counts = new Map<string, number>();
    const commands: unknown[][] = [];
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const command = JSON.parse(String(init.body)) as unknown[];
      commands.push(command);
      if (command[0] === "INCR") {
        const key = String(command[1]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return new Response(JSON.stringify({ result: counts.get(key) }));
      }
      return new Response(JSON.stringify({ result: 1 }));
    });
    return { fetchImpl: fetchImpl as unknown as typeof fetch, commands };
  }

  it("uses the shared Redis count and sets the window expiry once", async () => {
    const redis = fakeRedis();
    const results = [];
    for (let i = 0; i < 3; i += 1) results.push(await rateLimit("shared-a", 2, 60_000, { env, fetchImpl: redis.fetchImpl }));
    expect(results).toEqual([true, true, false]);
    expect(redis.commands.filter((c) => c[0] === "PEXPIRE")).toHaveLength(1);
  });

  it("falls back to the in-memory limit when Redis fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async () => new Response("down", { status: 500 })) as unknown as typeof fetch;
    expect(await rateLimit("fallback-a", 1, 60_000, { env, fetchImpl: failing })).toBe(true);
    expect(await rateLimit("fallback-a", 1, 60_000, { env, fetchImpl: failing })).toBe(false);
  });

  it("uses in-memory limiting when Redis is not configured", async () => {
    expect(await rateLimit("memory-a", 1, 60_000, { env: {} })).toBe(true);
    expect(await rateLimit("memory-a", 1, 60_000, { env: {} })).toBe(false);
  });

  it("keys on the first forwarded address", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe("203.0.113.5");
    expect(clientKey(new Headers())).toBe("local");
  });
});

describe("operator wallet balance", () => {
  const original = { ...appConfig.moonbeam };
  afterEach(() => Object.assign(appConfig.moonbeam, original));

  it("flags balances under the threshold", () => {
    expect(isBalanceLow(10n ** 17n, "1")).toBe(true);
    expect(isBalanceLow(2n * 10n ** 18n, "1")).toBe(false);
  });

  it("reports not configured without an operator key", async () => {
    Object.assign(appConfig.moonbeam, { rpcUrl: "", operatorPrivateKey: "" });
    expect((await new MoonbeamService().operatorWalletStatus()).configured).toBe(false);
  });

  it("reads the operator wallet balance and marks it low", async () => {
    Object.assign(appConfig.moonbeam, {
      rpcUrl: "http://rpc.invalid",
      // Well-known Hardhat test key; never holds real funds.
      operatorPrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    });
    const status = await new MoonbeamService().operatorWalletStatus(async () => 5n * 10n ** 17n);
    expect(status).toMatchObject({ configured: true, balance: "0.5", low: true });
    expect(status.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
