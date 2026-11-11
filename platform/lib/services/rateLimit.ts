/**
 * Fixed-window rate limiting.
 *
 * With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counts are kept in Redis so the limit
 * holds across every server instance. Without them, or if Redis cannot be reached, it falls back to
 * an in-memory count, which only limits requests that reach the same instance.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimitInMemory(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = hits.get(key);
  if (!current || current.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/** Runs commands in one Upstash REST pipeline call and returns each command's result in order. */
async function redisPipeline(url: string, token: string, commands: (string | number)[][], fetchImpl: typeof fetch) {
  const response = await fetchImpl(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  const body = (await response.json()) as Array<{ result?: unknown; error?: string }>;
  const failed = body.find((entry) => entry.error);
  if (failed) throw new Error(failed.error);
  return body.map((entry) => entry.result);
}

export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
  options: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}
): Promise<boolean> {
  const env = options.env ?? process.env;
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return rateLimitInMemory(key, limit, windowMs);

  const fetchImpl = options.fetchImpl ?? fetch;
  const redisKey = `gratifi:ratelimit:${key}`;
  try {
    // Create the key with its expiry before counting, so a key can never be left without a TTL
    // (which would block that client for good). INCR keeps the TTL that SET gave the key.
    const [, count] = await redisPipeline(
      url,
      token,
      [
        ["SET", redisKey, 0, "PX", windowMs, "NX"],
        ["INCR", redisKey]
      ],
      fetchImpl
    );
    return Number(count) <= limit;
  } catch (error) {
    console.error("Shared rate limit unavailable, using in-memory limit:", error);
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/** The client address for rate limiting: the first entry of x-forwarded-for, which the hosting proxy sets. */
export function clientKey(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
