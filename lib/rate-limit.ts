import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let rl: Ratelimit | null = null;

function getRateLimiter(): Ratelimit | null {
  if (rl) return rl;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  rl = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "worklog:rl",
  });
  return rl;
}

export async function rateLimit(key: string): Promise<boolean> {
  const limiter = getRateLimiter();
  if (!limiter) return true; // no Redis configured — allow through
  const { success } = await limiter.limit(key);
  return success;
}
