const logger = require('./logger');

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set(key, value, ttlSeconds = 300) {
    try {
      const now = Date.now();
      const expiry = now + (ttlSeconds * 1000);
      
      this.cache.set(key, {
        value,
        createdAt: now,
        lastAccessed: now
      });
      this.ttlMap.set(key, expiry);
      this.stats.sets++;
      
      logger.debug('Cache SET', { key, ttl: ttlSeconds });
      return true;
    } catch (error) {
      logger.error('Cache SET error', { key, error: error.message });
      return false;
    }
  }

  get(key) {
    try {
      const now = Date.now();
      const expiry = this.ttlMap.get(key);
      
      if (!expiry || now > expiry) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      const item = this.cache.get(key);
      if (item) {
        item.lastAccessed = now;
        this.stats.hits++;
        logger.debug('Cache HIT', { key });
        return item.value;
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      logger.error('Cache GET error', { key, error: error.message });
      this.stats.misses++;
      return null;
    }
  }

  delete(key) {
    try {
      const deleted = this.cache.delete(key) && this.ttlMap.delete(key);
      if (deleted) {
        this.stats.deletes++;
        logger.debug('Cache DELETE', { key });
      }
      return deleted;
    } catch (error) {
      logger.error('Cache DELETE error', { key, error: error.message });
      return false;
    }
  }

  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.ttlMap.clear();
    logger.info('Cache cleared', { previousSize: size });
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, expiry] of this.ttlMap.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cache cleanup completed', { 
        entriesRemoved: cleaned, 
        remainingEntries: this.cache.size 
      });
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      cacheSize: this.cache.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  getMemoryUsage() {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += JSON.stringify(key).length + JSON.stringify(value).length;
    }
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }
}

// Singleton instance
const cache = new MemoryCache();

// Helper functions for common cache patterns
const cacheHelpers = {
  // Cache with automatic JSON serialization
  setJSON: (key, data, ttl) => cache.set(key, JSON.stringify(data), ttl),
  getJSON: (key) => {
    const data = cache.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Cache with key generation
  generateKey: (...parts) => parts.join(':'),

  // Cache middleware for Express routes
  middleware: (keyGenerator, ttl = 300) => {
    return (req, res, next) => {
      const key = typeof keyGenerator === 'function' 
        ? keyGenerator(req) 
        : keyGenerator;
      
      const cachedData = cache.get(key);
      if (cachedData) {
        logger.debug('Cache middleware HIT', { key });
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        cache.set(key, data, ttl);
        logger.debug('Cache middleware SET', { key });
        return originalJson.call(this, data);
      };

      next();
    };
  }
};

module.exports = { cache, cacheHelpers };
