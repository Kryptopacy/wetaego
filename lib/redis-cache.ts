import { redis } from './upstash';
import { unstable_cache } from 'next/cache';

/**
 * Generic caching wrapper for data fetching operations.
 * Uses Upstash Redis as primary distributed cache, and Next.js unstable_cache as fallback memory cache.
 * @param key The unique cache key
 * @param fetcher The async function to execute if cache misses
 * @param ttlSeconds Time to live in seconds (default 60s)
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cachedFetcher = unstable_cache(fetcher, [key], { revalidate: ttlSeconds, tags: [key] });

  if (!redis) return await cachedFetcher();

  try {
    const cachedResult = await redis.get<T>(key);
    if (cachedResult !== null) {
      return cachedResult;
    }
  } catch (error) {
    console.error('Redis cache read error:', error);
  }

  // Execute cached fetcher and cache result in Redis
  const result = await cachedFetcher();
  
  if (result) {
    try {
      await redis.set(key, result, { ex: ttlSeconds });
    } catch (error) {
      console.error('Redis cache write error:', error);
    }
  }

  return result;
}

/**
 * Invalidates a specific cache key in Redis
 */
export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis cache invalidation error:', error);
  }
}
