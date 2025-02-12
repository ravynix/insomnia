require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const config = require('./config/index');
const { 
  fetchUserSleepData, 
  fetchAllSleepData, 
  updateSleepData,
  fetchUserSleepStats,
  deleteSleepData
} = require('./services/sleepData');
const { 
  calculateAverageSleepHours,
  applyCustomMetrics,
  calculateSleepDebt,
  calculateSleepConsistency,
  generateSleepRecommendations,
  generateSleepReport,
  calculateSleepDurationStats,
  calculateSleepDurations,
  calculateTotalSleepDuration
} = require('./services/dataProcessing');
const { 
  clearNamespaceCache,
  getCacheStats,
  validateCacheKey
} = require('./services/cache');
const logger = require('./utils/logger');

// SDK State Management
let isInitialized = false;
let sdkInstance = null;

/**
 * Core SDK Class with encapsulation and safety mechanisms
 */
class SleepSDK {
  constructor() {
    // Removed the check here because initialization is ensured before instantiation.
    // Bind methods to maintain context
    this.fetchUserSleepData = this._wrapWithErrorHandling(fetchUserSleepData);
    this.fetchAllSleepData = this._wrapWithErrorHandling(fetchAllSleepData);
    this.updateSleepData = this._wrapWithErrorHandling(updateSleepData);
    this.fetchUserSleepStats = this._wrapWithErrorHandling(fetchUserSleepStats);
    this.deleteSleepData = this._wrapWithErrorHandling(deleteSleepData);
    this.calculateAverageSleepHours = calculateAverageSleepHours;
    this.applyCustomMetrics = applyCustomMetrics;
    this.calculateSleepDebt = calculateSleepDebt;
    this.calculateSleepConsistency = calculateSleepConsistency;
    this.generateSleepRecommendations = generateSleepRecommendations;
    this.generateSleepReport = generateSleepReport;
    this.calculateSleepDurationStats = calculateSleepDurationStats;
    this.calculateSleepDurations = calculateSleepDurations;
    this.calculateTotalSleepDuration = calculateTotalSleepDuration;
    this.clearNamespaceCache = clearNamespaceCache;
    this.getCacheStats = getCacheStats;
    this.validateCacheKey = validateCacheKey;
  }

  /**
   * Error handling wrapper for SDK methods
   * @private
   */
  _wrapWithErrorHandling(fn, isAdmin = false) {
    return async (...args) => {
      try {
        if (isAdmin && !config.allowAdminOperations) {
          throw new Error('Admin operations are disabled in current configuration');
        }
        
        logger.debug(`Executing ${fn.name} with args:`, args);
        const result = await fn(...args);
        logger.info(`${fn.name} executed successfully`);
        return result;
      } catch (error) {
        logger.error(`SDK Operation Failed: ${error.message}`, {
          operation: fn.name,
          errorStack: error.stack
        });
        throw this._formatError(error);
      }
    };
  }

  /**
   * Error response format for consistency
   * @private
   */
  _formatError(error) {
    return {
      code: error.code || 'SDK_ERROR',
      message: error.message,
      timestamp: new Date().toISOString(),
      docs: config.docsUrl
    };
  }
}

/**
 * Initialize SDK with configuration
 * @param {Object} [userConfig] - Additional user configuration
 */
async function initialize(userConfig = {}) {
  try {

    // Warm-up cache
    if (config.cache.preload) {
      await warmUpCache();
    }

    // Set initialized flag before creating SDK instance to prevent constructor error
    isInitialized = true;
    // Create SDK instance
    sdkInstance = Object.freeze(new SleepSDK());

    logger.info(`🟢 SDK Initialized in ${config.environment} mode`);

    return sdkInstance;
  } catch (error) {
    logger.error('SDK Initialization Failed:', error);
    throw new Error(`Initialization Error: ${error.message}`);
  }
}

/**
 * Warm-up cache for initial performance
 */
async function warmUpCache() {
  try {
    logger.info('🔥 Warming up cache...');
    // Preload frequent requests
    await fetchAllSleepData({ limit: 100 });
    logger.info('✅ Cache warm-up completed');
  } catch (error) {
    logger.warn('Cache warm-up failed:', error.message);
  }
}

/**
 * Get SDK instance with safety check 
 */
function getSDK() {
  if (!isInitialized) {
    throw new Error('SDK not initialized. Call initialize() first');
  }
  return sdkInstance;
}

module.exports = {
  initialize,
  getSDK,
  __version__: require('../package.json').version
};
