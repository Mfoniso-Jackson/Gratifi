/**
 * Fixed-window rate limiting.
 *
 * With UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, counts are kept in Redis so the limit
 * holds across every server instance. Without them, or if Redis cannot be reached, it falls back to
 * an in-memory count, which only limits requests that reach the same instance.
 */
import { redisConfig, redisPipeline, type RedisOptions } from "@/lib/services/redis";

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

export async function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
  options: RedisOptions = {}
): Promise<boolean> {
  if (!redisConfig(options.env ?? process.env)) return rateLimitInMemory(key, limit, windowMs);

  const redisKey = `gratifi:ratelimit:${key}`;
  try {
    // Create the key with its expiry before counting, so a key can never be left without a TTL
    // (which would block that client for good). INCR keeps the TTL that SET gave the key.
    const [, count] = await redisPipeline(
      [
        ["SET", redisKey, 0, "PX", windowMs, "NX"],
        ["INCR", redisKey]
      ],
      options
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
