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

async function redisCommand(url: string, token: string, command: (string | number)[], fetchImpl: typeof fetch) {
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Redis responded ${response.status}`);
  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(body.error);
  return body.result;
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
    const count = Number(await redisCommand(url, token, ["INCR", redisKey], fetchImpl));
    if (count === 1) await redisCommand(url, token, ["PEXPIRE", redisKey, windowMs], fetchImpl);
    return count <= limit;
  } catch (error) {
    console.error("Shared rate limit unavailable, using in-memory limit:", error);
    return rateLimitInMemory(key, limit, windowMs);
  }
}

/** The client address for rate limiting: the first entry of x-forwarded-for, which the hosting proxy sets. */
export function clientKey(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
