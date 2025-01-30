const config = require('../config/index');
const logger = require('./logger'); // Assuming you have a logger utility

// Enhanced rate limiter state
const rateLimiterState = {
  requestCount: 0,
  lastResetTime: Date.now(),
  blockedUntil: null,
  stats: {
    totalRequests: 0,
    blockedRequests: 0,
    successfulRequests: 0
  }
};

// Rate limiter configuration
const RATE_LIMITER_CONFIG = {
  ...config.rateLimit,
  windowSize: 60000, // 1 minute window
  blockDuration: 300000, // 5 minutes block
  burstLimit: config.rateLimit.maxRequestsPerMinute * 1.5 // Allow some burst
};

/**
 * Enhanced rate limiter with burst protection and statistics
 * @param {string} [identifier] - Optional client identifier
 * @returns {Object} - Rate limiter result
 * @property {boolean} allowed - If request is allowed
 * @property {number} remaining - Remaining requests in window
 * @property {number} reset - Time until reset in milliseconds
 * @property {number} retryAfter - Time to wait if blocked (null if not blocked)
 */
function checkRateLimit(identifier) {
  const currentTime = Date.now();
  
  // Check if currently blocked
  if (rateLimiterState.blockedUntil && currentTime < rateLimiterState.blockedUntil) {
    rateLimiterState.stats.blockedRequests++;
    return {
      allowed: false,
      remaining: 0,
      reset: rateLimiterState.blockedUntil - currentTime,
      retryAfter: rateLimiterState.blockedUntil - currentTime
    };
  }

  // Reset counters if window has passed
  if (currentTime - rateLimiterState.lastResetTime > RATE_LIMITER_CONFIG.windowSize) {
    rateLimiterState.requestCount = 0;
    rateLimiterState.lastResetTime = currentTime;
  }

  // Check burst limit
  if (rateLimiterState.requestCount >= RATE_LIMITER_CONFIG.burstLimit) {
    rateLimiterState.blockedUntil = currentTime + RATE_LIMITER_CONFIG.blockDuration;
    logger.warn(`Rate limit exceeded for ${identifier || 'default'}. Blocking for ${RATE_LIMITER_CONFIG.blockDuration}ms`);
    return checkRateLimit(identifier); // Recursive call to handle block
  }

  // Check normal rate limit
  if (rateLimiterState.requestCount >= RATE_LIMITER_CONFIG.maxRequestsPerMinute) {
    rateLimiterState.stats.blockedRequests++;
    return {
      allowed: false,
      remaining: 0,
      reset: RATE_LIMITER_CONFIG.windowSize - (currentTime - rateLimiterState.lastResetTime),
      retryAfter: null
    };
  }

  // Allow request
  rateLimiterState.requestCount++;
  rateLimiterState.stats.successfulRequests++;
  rateLimiterState.stats.totalRequests++;
  
  return {
    allowed: true,
    remaining: RATE_LIMITER_CONFIG.maxRequestsPerMinute - rateLimiterState.requestCount,
    reset: RATE_LIMITER_CONFIG.windowSize - (currentTime - rateLimiterState.lastResetTime),
    retryAfter: null
  };
}

/**
 * Resets the rate limiter state completely
 * @param {boolean} [clearStats=false] - Whether to clear statistics
 */
function resetRateLimiter(clearStats = false) {
  rateLimiterState.requestCount = 0;
  rateLimiterState.lastResetTime = Date.now();
  rateLimiterState.blockedUntil = null;
  
  if (clearStats) {
    rateLimiterState.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      successfulRequests: 0
    };
  }
}

/**
 * Retrieves rate limiter statistics and current state
 * @returns {Object} - Rate limiter statistics
 */
function getRateLimiterStats() {
  return {
    ...rateLimiterState.stats,
    currentRequests: rateLimiterState.requestCount,
    isBlocked: !!rateLimiterState.blockedUntil,
    blockedUntil: rateLimiterState.blockedUntil,
    config: RATE_LIMITER_CONFIG
  };
}

module.exports = {
  checkRateLimit,
  resetRateLimiter,
  getRateLimiterStats
};