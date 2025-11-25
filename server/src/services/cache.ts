/**
 * Cache module with Redis (Google Memorystore) and in-memory fallback
 */

import Redis from 'ioredis';

type CacheEntry = { value: any; expiresAt: number };

// In-memory fallback cache
const memStore = new Map<string, CacheEntry>();

// Redis client (Google Memorystore)
let redisClient: Redis | null = null;
let redisAvailable = false;

// Initialize Redis connection
const initRedis = () => {
  // Only use Redis in production (Cloud Run) where it's accessible
  const isProduction = process.env.NODE_ENV === 'production';
  const redisHost = process.env.REDIS_HOST || '10.88.25.123';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  if (!isProduction) {
    console.log('⚠️ Development mode - using in-memory cache (Redis only available in production)');
    return;
  }

  if (!redisHost) {
    console.log('⚠️ REDIS_HOST not configured, using in-memory cache');
    return;
  }

  try {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('❌ Redis connection failed, falling back to in-memory cache');
          redisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000); // Retry with exponential backoff
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected to Google Memorystore:', redisHost);
      redisAvailable = true;
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('close', () => {
      console.log('⚠️ Redis connection closed, using in-memory cache');
      redisAvailable = false;
    });
  } catch (err) {
    console.error('❌ Failed to initialize Redis:', err);
    redisClient = null;
    redisAvailable = false;
  }
};

// Initialize on module load
initRedis();

/**
 * Store a value in cache with TTL (now async to support Redis)
 */
export async function setCache(key: string, value: any, ttlSeconds = 3600): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch (err) {
      console.error('❌ Redis setCache error, falling back to memory:', err);
    }
  }

  // Fallback to in-memory
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memStore.set(key, { value, expiresAt });
}

/**
 * Retrieve a value from cache (now async to support Redis)
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (redisAvailable && redisClient) {
    try {
      const result = await redisClient.get(key);
      return result ? JSON.parse(result) : null;
    } catch (err) {
      console.error('❌ Redis getCache error, falling back to memory:', err);
    }
  }

  // Fallback to in-memory
  const entry = memStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memStore.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Delete a cache entry (now async to support Redis)
 */
export async function delCache(key: string): Promise<void> {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (err) {
      console.error('❌ Redis delCache error:', err);
    }
  }

  // Fallback to in-memory
  memStore.delete(key);
}

/**
 * Cache wrapper for async functions
 */
export async function wrapCache<T = any>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const existing = await getCache<T>(key);
  if (existing !== null) return existing;
  const result = await fn();
  await setCache(key, result, ttlSeconds);
  return result;
}

/**
 * Get all cache keys (in-memory only)
 */
export function keys(): string[] {
  return Array.from(memStore.keys());
}

export default { getCache, setCache, delCache, wrapCache, keys };
