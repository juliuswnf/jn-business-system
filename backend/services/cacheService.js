import logger from '../utils/logger.js';

/**
 * Simple In-Memory Cache Service
 * For production, use Redis instead
 */

class CacheService {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Generate cache key from components
   */
  generateKey(...parts) {
    return parts.filter(Boolean).join(':');
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    this.stats.sets++;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now()
    });
  }

  /**
   * Delete specific key
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Pattern to match (e.g., 'booking:*')
   */
  deletePattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Invalidate cache for a specific entity type
   */
  invalidate(entityType, entityId = null) {
    if (entityId) {
      this.delete(this.generateKey(entityType, entityId));
    } else {
      this.deletePattern(`${entityType}:*`);
    }
    logger.debug(`Cache invalidated: ${entityType}${entityId ? ':' + entityId : ':*'}`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
      : 0;

    return {
      size: this.cache.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      hitRate: hitRate + '%'
    };
  }

  /**
   * Destroy the cache service
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Singleton instance
const cacheService = new CacheService();

// Cache decorator for async functions
export const cached = (keyGenerator, ttlSeconds = 300) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const key = keyGenerator(...args);
      const cachedValue = cacheService.get(key);

      if (cachedValue !== null) {
        return cachedValue;
      }

      const result = await originalMethod.apply(this, args);
      cacheService.set(key, result, ttlSeconds);
      return result;
    };

    return descriptor;
  };
};

// Helper function for caching in controllers
export const withCache = async (key, ttl, fetchFn) => {
  const cached = cacheService.get(key);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  const data = await fetchFn();
  cacheService.set(key, data, ttl);
  return { data, fromCache: false };
};

export default cacheService;
