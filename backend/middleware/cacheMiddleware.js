/**
 * Response Caching Middleware
 * 
 * Caches GET request responses in memory to reduce database load.
 * Uses node-cache for simple in-memory caching.
 * 
 * Usage:
 *   router.get('/api/salons/:slug', cacheResponse(300), getSalon);
 */

import NodeCache from 'node-cache';
import logger from '../utils/logger.js';

// Create cache instance
// stdTTL: Default time-to-live in seconds
// checkperiod: Automatic delete check interval in seconds
const cache = new NodeCache({ 
  stdTTL: 300,  // 5 minutes default
  checkperiod: 60,  // Check for expired keys every 60 seconds
  useClones: false  // Faster, but be careful with mutations
});

// Track cache stats
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Middleware to cache GET responses
 * @param {number} duration - Cache duration in seconds (default: 300)
 * @returns {Function} Express middleware
 */
export function cacheResponse(duration = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if explicitly disabled
    if (req.headers['x-no-cache'] === 'true') {
      return next();
    }

    // Generate cache key from URL + query params + user
    const userId = req.user?.id || 'anonymous';
    const key = `cache:${userId}:${req.originalUrl || req.url}`;

    // Check if response is in cache
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      cacheHits++;
      logger.debug(`Cache HIT: ${key}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Cache miss
    cacheMisses++;
    logger.debug(`Cache MISS: ${key}`);
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, duration);
        logger.debug(`Cached response: ${key} (TTL: ${duration}s)`);
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Clear cache for specific pattern
 * @param {string} pattern - Pattern to match keys (e.g., 'cache:*:salon')
 */
export function clearCache(pattern) {
  const keys = cache.keys();
  const matchedKeys = keys.filter(key => key.includes(pattern));
  
  matchedKeys.forEach(key => cache.del(key));
  
  logger.info(`Cache cleared: ${matchedKeys.length} keys matching "${pattern}"`);
  return matchedKeys.length;
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  const keyCount = cache.keys().length;
  cache.flushAll();
  logger.info(`Cache cleared: All ${keyCount} keys`);
  return keyCount;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const keys = cache.keys();
  const totalRequests = cacheHits + cacheMisses;
  const hitRate = totalRequests > 0 ? (cacheHits / totalRequests * 100).toFixed(2) : 0;

  return {
    keys: keys.length,
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: `${hitRate}%`,
    size: cache.getStats()
  };
}

/**
 * Middleware to clear cache after mutations
 * Use this after POST/PUT/DELETE operations
 */
export function invalidateCache(pattern) {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to clear cache after response
    res.json = function(data) {
      // Only clear cache on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearCache(pattern);
      }
      return originalJson(data);
    };
    
    next();
  };
}

export default { 
  cacheResponse, 
  clearCache, 
  clearAllCache, 
  getCacheStats,
  invalidateCache
};
