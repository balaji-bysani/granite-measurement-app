// Redis configuration with connection pooling
const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis server connection refused');
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('Redis retry time exhausted');
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('Redis connection attempts exceeded');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('ready', () => {
  console.log('Redis client ready');
});

client.on('end', () => {
  console.log('Redis connection ended');
});

// Connect to Redis (only if configured)
if (process.env.REDIS_HOST) {
  client.connect().catch(console.error);
} else {
  console.log('Redis not configured, caching disabled');
}

/**
 * Cache utility functions
 */
const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (!process.env.REDIS_HOST) return null;
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with expiration
   */
  async set(key, value, expireInSeconds = 3600) {
    try {
      if (!process.env.REDIS_HOST) return false;
      await client.setEx(key, expireInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      if (!process.env.REDIS_HOST) return false;
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern) {
    try {
      if (!process.env.REDIS_HOST) return false;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Cache clear pattern error:', error);
      return false;
    }
  }
};

module.exports = { client, cache };