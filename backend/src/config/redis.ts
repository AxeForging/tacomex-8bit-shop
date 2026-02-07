import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      console.error('Cache set error:', err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Cache delete error:', err);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error('Cache delete pattern error:', err);
    }
  },

  // Cart operations (stored in Redis for fast access)
  async getCart(userId: number): Promise<unknown[]> {
    const cart = await this.get<unknown[]>(`cart:${userId}`);
    return cart || [];
  },

  async setCart(userId: number, items: unknown[]): Promise<void> {
    await this.set(`cart:${userId}`, items, 86400); // 24 hour TTL
  },

  async clearCart(userId: number): Promise<void> {
    await this.del(`cart:${userId}`);
  },

  // Session/token blacklist (for logout)
  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, true, ttlSeconds);
  },

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.get<boolean>(`blacklist:${token}`);
    return result === true;
  },
};

export default redis;
