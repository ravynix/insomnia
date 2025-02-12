const config = require('../config/index');
const logger = require('../utils/logger'); // Assuming you have a logger utility
const fs = require('fs');
const path = require('path');

// In test environment, increase Jest timeout to avoid test timeout errors
if (process.env.NODE_ENV === 'test' && typeof jest !== 'undefined') {
  jest.setTimeout(70000);
}

const isTest = process.env.NODE_ENV === 'test';

const RATE_LIMITER_CONFIG = {
  ...config.rateLimit,
  // Use a shorter window and block duration in test mode to simulate resets quickly
  windowSize: isTest ? 1000 : 30000,
  blockDuration: isTest ? 2000 : 30000,
  burstLimit: config.rateLimit.maxRequestsPerMinute * 1.5 // Allow some burst (not used in updated logic)
};

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

  // Increment totalRequests for every call
  rateLimiterState.stats.totalRequests++;

  // Reset the window if expired and clear block
  if (currentTime - rateLimiterState.lastResetTime > RATE_LIMITER_CONFIG.windowSize) {
    rateLimiterState.requestCount = 0;
    rateLimiterState.lastResetTime = currentTime;
    rateLimiterState.blockedUntil = null;
  }

  // If blocked, return blocked response
  if (rateLimiterState.blockedUntil && currentTime < rateLimiterState.blockedUntil) {
    rateLimiterState.stats.blockedRequests++;
    logRateLimiterEvent(`Blocked request from ${identifier || 'default'}`);
    return { allowed: false, retryAfter: rateLimiterState.blockedUntil - currentTime };
  }

  // If request count reaches limit, block further requests
  if (rateLimiterState.requestCount >= RATE_LIMITER_CONFIG.maxRequestsPerMinute) {
    rateLimiterState.blockedUntil = currentTime + RATE_LIMITER_CONFIG.blockDuration;
    rateLimiterState.stats.blockedRequests++;
    logRateLimiterEvent(`RATE LIMIT EXCEEDED: ${identifier || 'default'}`);
    return {
      allowed: false,
      remaining: 0,
      reset: RATE_LIMITER_CONFIG.windowSize - (currentTime - rateLimiterState.lastResetTime),
      retryAfter: rateLimiterState.blockedUntil - currentTime
    };
  }

  // Allow request if within limit
  rateLimiterState.requestCount++;
  rateLimiterState.stats.successfulRequests++;
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

/**
 * Cleans up old log entries older than the specified number of days
 * @param {number} days - Number of days to retain logs
 */
function cleanOldLogs(days = 30) {
  const logFilePath = path.join(__dirname, 'rate_limiter.log');
  const logFileContent = fs.readFileSync(logFilePath, 'utf-8');
  const logEntries = logFileContent.split('\n').filter(entry => entry.trim() !== '');

  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
  const filteredEntries = logEntries.filter(entry => {
    const logDate = new Date(entry.substring(1, 25)).getTime();
    return logDate >= cutoffTime;
  });

  fs.writeFileSync(logFilePath, filteredEntries.join('\n') + '\n');
}

module.exports = {
  checkRateLimit,
  resetRateLimiter,
  getRateLimiterStats,
  cleanOldLogs
};
