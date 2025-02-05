const NodeCache = require('node-cache');

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
 * Helper function to generate a namespaced key
 * @param {string} namespace - The cache namespace
 * @param {string} key - The cache key
 * @returns {string} Namespaced key
 */
function getNamespacedKey(namespace, key) {
  return `${namespace}:${key}`;
}

/**
 * Retrieves cached data with enhanced error handling and statistics
 * @param {string} key - Cache key identifier
 * @param {Object} [options] - Retrieval options
 * @param {boolean} [options.refreshTTL=false] - Refresh TTL on access
 * @param {Function} [options.fallback] - Fallback function if cache miss
 * @param {string} [options.namespace='default'] - Namespace for the cache key
 * @returns {Promise<*>} Cached data or fallback result
 */
async function getCachedData(key, options = {}) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('Cache key must be a non-empty string');
  }
  
  const namespacedKey = getNamespacedKey(options.namespace || 'default', key);
  
  try {
    const value = cache.get(namespacedKey);
    
    if (value !== undefined) {
      cacheStats.hits++;
      if (options.refreshTTL) {
        cache.ttl(namespacedKey, cache.options.stdTTL);
      }
      return value;
    }
    
    cacheStats.misses++;
    
    if (options.fallback) {
      const fallbackValue = await options.fallback();
      await setCachedData(key, fallbackValue, undefined, { namespace: options.namespace });
      return fallbackValue;
    }
    
    return null;
  } catch (error) {
    console.error(`Cache retrieval error for key ${key}:`, error);
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
 * @param {string} [options.namespace='default'] - Namespace for the cache key
 * @returns {boolean} Operation success status
 */
function setCachedData(key, data, ttl, options = {}) {
  if (!key || typeof key !== 'string') {
    throw new TypeError('Cache key must be a non-empty string');
  }

  if (data === undefined) {
    throw new Error('Cannot cache undefined value');
  }
  
  const namespacedKey = getNamespacedKey(options.namespace || 'default', key);

  try {
    const success = cache.set(namespacedKey, data, ttl || cache.options.stdTTL);
    if (success) {
      cacheStats.sets++;
      console.debug(`Cache set for key: ${namespacedKey}`);
    }
    return success;
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    throw error;
  }
}

/**
 * Clears cache for a specific namespace
 * @param {string} namespace - Namespace to clear
 * @returns {number} Number of keys deleted
 */
function clearNamespaceCache(namespace) {
  try {
    const keysToDelete = cache.keys().filter(key => key.startsWith(`${namespace}:`));
    const deleteCount = keysToDelete.length;
    cache.del(keysToDelete);
    cacheStats.deletes += deleteCount;
    
    console.info(`Cleared ${deleteCount} cache keys in namespace: ${namespace}`);
    return deleteCount;
  } catch (error) {
    console.error('Namespace cache clearance error:', error);
    throw error;
  }
}

/**
 * Function to clear all expired cache entries.
 * This function iterates over all keys in the cache and deletes those that have expired.
 * It also updates the cache statistics for the number of deletions.
 */
function clearExpiredCache() {
  cache.keys((err, keys) => {
    if (!err) {
      keys.forEach(key => {
        if (cache.getTtl(key) && cache.getTtl(key) < Date.now()) {
          cache.del(key);
          cacheStats.deletes++;
        }
      });
    }
  });
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
  clearNamespaceCache,
  clearExpiredCache,
  getCacheStats,
  validateCacheKey
};