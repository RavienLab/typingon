import { redis } from "./redis";

export async function rateLimit(key: string, limit = 5, window = 60) {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return false;
  }

  return true;
}