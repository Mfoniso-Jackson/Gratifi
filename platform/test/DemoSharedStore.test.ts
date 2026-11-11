import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient, DEMO_DATA_KEY } from "@/lib/demo/client";

const env = { UPSTASH_REDIS_REST_URL: "https://redis.example", UPSTASH_REDIS_REST_TOKEN: "token" };

/** A tiny fake of the Upstash pipeline API supporting GET and SET (with EX and NX). */
function fakeRedis() {
  const store = new Map<string, { value: string; ex: number | null }>();
  const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
    const commands = JSON.parse(String(init.body)) as (string | number)[][];
    const results = commands.map((command) => {
      const key = String(command[1]);
      if (command[0] === "GET") return { result: store.get(key)?.value ?? null };
      if (command.includes("NX") && store.has(key)) return { result: null };
      const exIndex = command.indexOf("EX");
      store.set(key, { value: String(command[2]), ex: exIndex > 0 ? Number(command[exIndex + 1]) : null });
      return { result: "OK" };
    });
    return new Response(JSON.stringify(results));
  });
  return { store, fetchImpl: fetchImpl as unknown as typeof fetch };
}

// Each "instance" starts with empty process memory, as a separate serverless function would.
function freshInstance() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

describe("demo data shared through Redis", () => {
  beforeEach(freshInstance);

  it("shows a tip recorded on one instance to the next instance", async () => {
    const redis = fakeRedis();
    const options = { env, fetchImpl: redis.fetchImpl };

    const created = await createDemoClient(options)
      .from("recognition_events")
      .insert({ amount_pence: 1234, message: "From instance A" })
      .select("*")
      .single();
    expect(created.error).toBeNull();

    freshInstance();
    const read = await createDemoClient(options).from("recognition_events").select("*").eq("id", created.data.id).maybeSingle();
    expect(read.data?.message).toBe("From instance A");
    expect(redis.store.get(DEMO_DATA_KEY)?.ex).toBe(7 * 24 * 60 * 60);
  });

  it("seeds the sample data once and reuses it", async () => {
    const redis = fakeRedis();
    const options = { env, fetchImpl: redis.fetchImpl };
    const venues = await createDemoClient(options).from("venues").select("*");
    expect(venues.data.length).toBe(3);
    const seeded = redis.store.get(DEMO_DATA_KEY)?.value;
    freshInstance();
    await createDemoClient(options).from("venues").select("*");
    expect(redis.store.get(DEMO_DATA_KEY)?.value).toBe(seeded);
  });

  it("falls back to process memory when Redis fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async () => new Response("down", { status: 500 })) as unknown as typeof fetch;
    const result = await createDemoClient({ env, fetchImpl: failing }).from("venues").select("*");
    expect(result.data.length).toBe(3);
  });

  it("uses process memory when Redis is not configured", async () => {
    const client = createDemoClient({ env: {} });
    await client.from("venues").update({ name: "Renamed" }).eq("slug", "demo-cafe");
    const read = await client.from("venues").select("*").eq("slug", "demo-cafe").single();
    expect(read.data.name).toBe("Renamed");
  });
});
