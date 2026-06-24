import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Initialize Redis only if env variables exist
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) 
  ? Redis.fromEnv() 
  : null;

// General API rate limiter (e.g., AI generation, public webhooks)
export const globalRateLimiter = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
      analytics: true,
    })
  : null;

/**
 * Validates request rate limit based on IP.
 * @returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(actionName: string, customIdentifier?: string) {
  if (!globalRateLimiter) return { success: true };
  
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for') || 'anonymous';
  
  // Use customIdentifier (like a session token) if provided, otherwise fallback to IP
  const identity = customIdentifier || ip;
  const key = `rate_limit_${actionName}_${identity}`;
  
  return await globalRateLimiter.limit(key);
}

/**
 * Checks if an idempotency key exists. If it does, returns the cached result.
 * If not, it executes the callback, caches the result for 24 hours, and returns it.
 * This is the industry-standard Stripe-like idempotency pattern.
 */
export async function withIdempotency<T>(
  idempotencyKey: string, 
  callback: () => Promise<T>
): Promise<T> {
  if (!redis || !idempotencyKey) return await callback();

  const cacheKey = `idempotency_${idempotencyKey}`;
  
  // 1. Check if key exists
  const cachedResult = await redis.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // 2. Execute the action
  const result = await callback();

  // 3. Cache the successful result for 24 hours (86400 seconds)
  await redis.set(cacheKey, result, { ex: 86400 });
  
  return result;
}
