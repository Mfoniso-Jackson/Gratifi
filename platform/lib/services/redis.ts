/**
 * Minimal Upstash Redis client over its REST API (no extra package).
 * Configured with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
export interface RedisOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

export function redisConfig(env: Record<string, string | undefined> = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

/** Runs commands in one pipeline call and returns each command's result in order. Throws if Redis is not configured. */
export async function redisPipeline(commands: (string | number)[][], options: RedisOptions = {}) {
  const config = redisConfig(options.env ?? process.env);
  if (!config) throw new Error("Redis is not configured");
  const response = await (options.fetchImpl ?? fetch)(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  const body = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  const failed = body.find((entry) => entry.error);
  if (failed) throw new Error(failed.error);
  return body.map((entry) => entry.result);
}
