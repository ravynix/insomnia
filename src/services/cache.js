const NodeCache = require('node-cache');
const logger = require('./logger'); 

// Cache configuration with enhanced settings
const cache = new NodeCache({
  stdTTL: 3600, // Default TTL: 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Better performance for large objects
  deleteOnExpire: true, // Automatically delete expired keys
  maxKeys: 1000 // Prevent memory overuse
});

// Cache statistics
let cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0
};

/**
 * Retrieves cached data with enhanced error handling and statistics
 * @param {string} key - Cache key identifier
 * @param {Object} [options] - Retrieval options
 * @param {boolean} [options.refreshTTL=false] - Refresh TTL on access
 * @param {Function} [options.fallback] - Fallback function if cache miss
 * @returns {Promise<*>} Cached data or fallback result
 */
async function getCachedData(key, options = {}) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('Cache key must be a non-empty string');
  }

  try {
    const value = cache.get(key);
    
    if (value !== undefined) {
      cacheStats.hits++;
      if (options.refreshTTL) {
        cache.ttl(key, cache.options.stdTTL);
      }
      return value;
    }

    cacheStats.misses++;
    
    if (options.fallback) {
      const fallbackValue = await options.fallback();
      await setCachedData(key, fallbackValue);
      return fallbackValue;
    }

    return null;
  } catch (error) {
    logger.error(`Cache retrieval error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Sets or updates cached data with validation and statistics
 * @param {string} key - Cache key identifier
 * @param {*} data - Data to cache
 * @param {number} [ttl] - Custom TTL in seconds
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.overwrite=true] - Overwrite existing key
 * @returns {boolean} Operation success status
 */
function setCachedData(key, data, ttl, options = {}) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('Cache key must be a non-empty string');
  }

  if (data === undefined) {
    throw new Error('Cannot cache undefined value');
  }

  try {
    const success = cache.set(key, data, ttl || cache.options.stdTTL);
    if (success) {
      cacheStats.sets++;
      logger.debug(`Cache set for key: ${key}`);
    }
    return success;
  } catch (error) {
    logger.error(`Cache set error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Clears cache with optional pattern matching
 * @param {string} [pattern] - Optional key pattern to clear
 * @returns {number} Number of keys deleted
 */
function clearHistoricalCache(pattern) {
  try {
    let keysToDelete = cache.keys();
    
    if (pattern) {
      const regex = new RegExp(pattern);
      keysToDelete = keysToDelete.filter(key => regex.test(key));
    }

    const deleteCount = keysToDelete.length;
    cache.del(keysToDelete);
    cacheStats.deletes += deleteCount;
    
    logger.info(`Cleared ${deleteCount} cache keys${pattern ? ` matching ${pattern}` : ''}`);
    return deleteCount;
  } catch (error) {
    logger.error('Cache clearance error:', error);
    throw error;
  }
}

/**
 * Retrieves cache statistics and health metrics
 * @returns {Object} Cache performance and health data
 */
function getCacheStats() {
  return {
    ...cacheStats,
    size: cache.keys().length,
    memoryUsage: process.memoryUsage().heapUsed,
    uptime: process.uptime(),
    cacheConfig: cache.options
  };
}

/**
 * Middleware for cache key validation
 * @param {string} key - Cache key to validate
 * @throws {Error} If key is invalid
 */
function validateCacheKey(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid cache key: must be a non-empty string');
  }
  
  if (key.length > 256) {
    throw new Error('Cache key too long: maximum 256 characters');
  }
  
  if (!/^[a-zA-Z0-9_\-.:]+$/.test(key)) {
    throw new Error('Cache key contains invalid characters');
  }
}

module.exports = {
  getCachedData,
  setCachedData,
  clearHistoricalCache,
  getCacheStats,
  validateCacheKey
};