const axios = require('axios');
const config = require('../config/index');
const { checkRateLimit } = require('./rateLimiter');
const { getCachedData, setCachedData } = require('./cache');

const API_BASE_URL = process.env.API_BASE_URL;

/**
 * @classdesc Custom error class for API-related exceptions
 * @extends Error
 * @property {string} type - Error type/category for programmatic handling
 * @property {number} status - HTTP status code equivalent
 */
class ApiError extends Error {
    /**
     * @param {string} message - Human-readable error description
     * @param {string} type - Machine-readable error type
     * @param {number} [status=500] - HTTP status code equivalent
     */
  constructor(message, type, status) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status || 500;
  }
}

/**
 * @classdesc Network connectivity error (extends ApiError)
 * @extends ApiError
 */
class NetworkError extends ApiError {
  constructor() {
    super('No response from server', 'network_error', 503);
  }
}

/**
 * @classdesc Authentication/Authorization error (extends ApiError)
 * @extends ApiError
 */
class AuthError extends ApiError {
  constructor() {
    super('Invalid API key', 'auth_error', 401);
  }
}

/**
 * Fetches sleep data for a specific user with caching and rate limiting
 * @async
 * @param {string} userId - UUIDv4 user identifier
 * @param {Object} [options={}] - Additional query parameters
 * @param {string} [options.dateRange] - Date range filter (ISO 8601 format)
 * @param {boolean} [options.includeStages=true] - Include sleep stage details
 * @returns {Promise<Object>} Sleep data object
 * @throws {ApiError} When API request fails
 * @throws {NetworkError} On network connectivity issues
 * @example
 * const data = await fetchUserSleepData('user-123', {
 *   dateRange: '2023-01-01/2023-01-31'
 * });
 */
async function fetchUserSleepData(userId, options = {}) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);

    const cacheKey = `userSleepData_${userId}`;
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData?.timestamp > Date.now() - 21600 * 1000) {
      return cachedData.data;
    }

    const response = await axios.get(`${API_BASE_URL}/sleep/${userId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      params: { ...config.defaultOptions, ...options },
      timeout: 10000 // 10-second timeout
    });

    setCachedData(cacheKey, response.data, 21600);
    return response.data;

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Retrieves aggregated sleep data for all users
 * @async
 * @param {Object} [options={}] - Filtering and pagination options
 * @param {number} [options.limit=100] - Maximum records to return
 * @param {string} [options.sortBy] - Sorting field (duration|startTime)
 * @returns {Promise<Array<Object>>} Array of sleep records
 * @throws {ApiError} When API request fails
 * @throws {NetworkError} On network connectivity issues
 */
async function fetchAllSleepData(options = {}) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);

    const cacheKey = 'allSleepData';
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData?.timestamp > Date.now() - 21600 * 1000) {
      return cachedData.data;
    }

    const response = await axios.get(`${API_BASE_URL}/sleep/all`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      params: options,
      timeout: 15000 // 15-second timeout
    });

    setCachedData(cacheKey, response.data, 21600);
    return response.data;

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Batch deletion of sleep records with safety confirmation
 * @async
 * @param {Array<string>} idsToDelete - Array of record IDs to delete
 * @param {Object} [options={}] - Additional deletion parameters
 * @param {boolean} [forceDelete=false] - Bypass confirmation prompt
 * @returns {Promise<Object>} Deletion result with status
 * @throws {ApiError} When deletion is cancelled or fails
 * @throws {AuthError} On authorization failures
 */
async function batchDeleteSleepData(idsToDelete, options = {}, forceDelete = false) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);
    
    if (!forceDelete) {
      throw new ApiError(
        'Deletion requires confirmation', 
        'confirmation_required', 
        400
      );
    }

    const response = await axios.delete(`${API_BASE_URL}/sleep`, {
      headers: { 
        Authorization: `Bearer ${config.apiKey}`,
        'Idempotency-Key': generateIdempotencyKey() 
      },
      data: { ids: idsToDelete, ...options },
      timeout: 20000 // 20-second timeout
    });

    return {
      success: true,
      deletedCount: response.data.deletedCount,
      warnings: response.data.warnings
    };

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Centralized error handler for API operations
 * @private
 * @param {Error} error - Original error object
 * @throws {ApiError|NetworkError|AuthError} Typed error instance
 */
function handleApiError(error) {
  // Axios-specific errors
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    switch(status) {
      case 400:
        throw new ApiError(
          data?.message || 'Invalid request parameters',
          'bad_request',
          status
        );
        
      case 401:
        throw new AuthError();
        
      case 404:
        throw new ApiError(
          'Requested resource not found',
          'not_found',
          status
        );
        
      case 429:
        throw new ApiError(
          'Too many requests',
          'rate_limit_error',
          status
        );
        
      default:
        throw new ApiError(
          data?.message || `HTTP Error ${status}`,
          'http_error',
          status
        );
    }
  }
  
  // Custom API errors
  if (error instanceof ApiError) {
    error.stack = error.stack + '\n' + new Error().stack;
    throw error;
  }

  // Network errors
  if (error.code === 'ECONNABORTED') {
    throw new NetworkError();
  }

  // Unknown errors
  throw new ApiError(
    error.message || 'Unknown API error',
    'unknown_error',
    500
  );
}

/**
 * Generates unique idempotency key for write operations
 * @private
 * @returns {string} Base64-encoded unique key
 */
function generateIdempotencyKey() {
  return Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
}

module.exports = {
  fetchUserSleepData,
  fetchAllSleepData,
  batchDeleteSleepData,
  ApiError,
  NetworkError,
  AuthError
};