import { redis } from "./redis";

export async function rateLimit(
  key: string,
  limit = 5,
  window = 60
) {
  // 🚫 No Redis → skip rate limiting (fail open)
  if (!redis) {
    return true;
  }

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, window);
    }

    if (current > limit) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Rate limit error:", error);
    return true; // fail open (never block user on infra failure)
  }
}