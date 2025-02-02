const config = require('../config/index');
const logger = require('./logger'); // Assuming you have a logger utility
const fs = require('fs');

// Enhanced rate limiter with logging to file
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

const RATE_LIMITER_CONFIG = {
  ...config.rateLimit,
  windowSize: 60000, // 1 minute window
  blockDuration: 300000, // 5 minutes block
  burstLimit: config.rateLimit.maxRequestsPerMinute * 1.5 // Allow some burst
};

/**
 * Logs rate limiter events to a file for auditing purposes
 * @param {string} message - Log message
 */
function logRateLimiterEvent(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync('rate_limiter.log', logMessage);
}

/**
 * Checks the rate limit and logs events
 * @param {string} [identifier] - Optional client identifier
 * @returns {Object} - Rate limiter result
 */
function checkRateLimit(identifier) {
  const currentTime = Date.now();

  if (rateLimiterState.blockedUntil && currentTime < rateLimiterState.blockedUntil) {
    rateLimiterState.stats.blockedRequests++;
    logRateLimiterEvent(`BLOCKED: ${identifier || 'default'}`);
    return {
      allowed: false,
      remaining: 0,
      reset: rateLimiterState.blockedUntil - currentTime,
      retryAfter: rateLimiterState.blockedUntil - currentTime
    };
  }

  if (currentTime - rateLimiterState.lastResetTime > RATE_LIMITER_CONFIG.windowSize) {
    rateLimiterState.requestCount = 0;
    rateLimiterState.lastResetTime = currentTime;
  }

  if (rateLimiterState.requestCount >= RATE_LIMITER_CONFIG.burstLimit) {
    rateLimiterState.blockedUntil = currentTime + RATE_LIMITER_CONFIG.blockDuration;
    logger.warn(`Rate limit exceeded for ${identifier || 'default'}. Blocking for ${RATE_LIMITER_CONFIG.blockDuration}ms`);
    logRateLimiterEvent(`RATE LIMIT EXCEEDED: ${identifier || 'default'}`);
    return checkRateLimit(identifier);
  }

  if (rateLimiterState.requestCount >= RATE_LIMITER_CONFIG.maxRequestsPerMinute) {
    rateLimiterState.stats.blockedRequests++;
    logRateLimiterEvent(`LIMIT REACHED: ${identifier || 'default'}`);
    return {
      allowed: false,
      remaining: 0,
      reset: RATE_LIMITER_CONFIG.windowSize - (currentTime - rateLimiterState.lastResetTime),
      retryAfter: null
    };
  }

  rateLimiterState.requestCount++;
  rateLimiterState.stats.successfulRequests++;
  rateLimiterState.stats.totalRequests++;
  logRateLimiterEvent(`ALLOWED: ${identifier || 'default'}`);

  return {
    allowed: true,
    remaining: RATE_LIMITER_CONFIG.maxRequestsPerMinute - rateLimiterState.requestCount,
    reset: RATE_LIMITER_CONFIG.windowSize - (currentTime - rateLimiterState.lastResetTime),
    retryAfter: null
  };
}

/**
 * Resets the rate limiter state and clears log file if specified
 * @param {boolean} [clearStats=false] - Whether to clear statistics
 * @param {boolean} [clearLog=false] - Whether to clear the log file
 */
function resetRateLimiter(clearStats = false, clearLog = false) {
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

  if (clearLog) {
    fs.writeFileSync('rate_limiter.log', '');
    logRateLimiterEvent('Log file cleared.');
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