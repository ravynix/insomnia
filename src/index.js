require('dotenv').config({ path: process.env.ENV_PATH || '.env' });

const config = require('./config/index');
const { 
  fetchUserSleepData, 
  fetchAllSleepData, 
  batchDeleteSleepData 
} = require('./services/sleepData');
const { 
  calculateAverageSleepHours,
  applyCustomMetrics
} = require('./services/dataProcessing');
const { 
  clearHistoricalCache,
  getCacheStats
} = require('./services/cache');
const logger = require('./utils/logger');
const { validateConfig } = require('./config/validator');

// SDK State Management
let isInitialized = false;
let sdkInstance = null;

/**
 * Core SDK Class dengan encapsulation dan safety mechanisms
 */
class SleepSDK {
  constructor() {
    if (!isInitialized) {
      throw new Error('SDK must be initialized before use');
    }

    // Bind methods untuk maintain context
    this.fetchUserSleepData = this._wrapWithErrorHandling(fetchUserSleepData);
    this.fetchAllSleepData = this._wrapWithErrorHandling(fetchAllSleepData);
    this.batchDeleteSleepData = this._wrapWithErrorHandling(batchDeleteSleepData, true);
    this.calculateAverageSleepHours = calculateAverageSleepHours;
    this.applyCustomMetrics = applyCustomMetrics;
    this.clearHistoricalCache = clearHistoricalCache;
    this.getCacheStats = getCacheStats;
  }

  /**
   * Error handling wrapper untuk SDK methods
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
   * Format error response untuk konsistensi
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
 * Initialize SDK dengan konfigurasi
 * @param {Object} [userConfig] - Konfigurasi tambahan pengguna
 */
async function initialize(userConfig = {}) {
  try {
    // Validasi environment variables
    validateConfig();
    
    // Merge configuration
    config.merge(userConfig);
    
    // Init logging system
    logger.init(config.logging);

    // Warm-up cache
    if (config.cache.preload) {
      await warmUpCache();
    }

    // Create SDK instance
    sdkInstance = Object.freeze(new SleepSDK());
    isInitialized = true;

    logger.info(`🟢 SDK Initialized in ${config.environment} mode`);
    logger.debug('Runtime Configuration:', config.getPublicConfig());

    return sdkInstance;
  } catch (error) {
    logger.error('SDK Initialization Failed:', error);
    throw new Error(`Initialization Error: ${error.message}`);
  }
}

/**
 * Warm-up cache untuk performa awal
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
 * Get SDK instance dengan safety check
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