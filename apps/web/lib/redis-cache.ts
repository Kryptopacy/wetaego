import { redis } from './upstash';

/**
 * Generic caching wrapper for data fetching operations.
 * @param key The unique cache key
 * @param fetcher The async function to execute if cache misses
 * @param ttlSeconds Time to live in seconds (default 60s)
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  if (!redis) return await fetcher();

  try {
    const cachedResult = await redis.get<T>(key);
    if (cachedResult !== null) {
      return cachedResult;
    }
  } catch (error) {
    console.error('Redis cache read error:', error);
  }

  // Execute fetcher and cache result
  const result = await fetcher();
  
  if (result) {
    try {
      await redis.set(key, result, { ex: ttlSeconds });
    } catch (error) {
      console.error('Redis cache write error:', error);
    }
  }

  return result;
}
