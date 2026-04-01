import Redis from "ioredis";

export const redis =
  process.env.REDIS_URL && process.env.NODE_ENV !== "production"
    ? new Redis(process.env.REDIS_URL)
    : null;