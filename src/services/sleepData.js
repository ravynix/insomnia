const axios = require('axios');
const config = require('../config/index');
const { checkRateLimit } = require('./rateLimiter');
const { getCachedData, setCachedData } = require('./cache');

const API_BASE_URL = process.env.API_BASE_URL;

// =============================
// Custom Error Classes
// =============================


/**
 * Retry function for API requests.
 * Tries the request up to `maxRetries` times before throwing an error.
 * 
 * @param {Function} fn - The function to execute.
 * @param {number} retries - Number of retries before failing.
 * @returns {Promise<Object>} - Resolves with the API response.
 */
async function retryRequest(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
}

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
    this.status = status || 500; // Default to internal server error
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

// =============================
// API Functions
// =============================

/**
 * Fetch user sleep data from the API.
 * Implements caching to reduce redundant API calls.
 * 
 * @param {string} userId - The user ID whose sleep data is being fetched.
 * @param {Object} options - Optional query parameters for filtering data.
 * @returns {Promise<Object>} - Returns user sleep data.
 */
async function fetchUserSleepData(userId, options = {}) {
  try {
    // Check rate limiting
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);

    // Check cache first to avoid redundant API calls
    const cacheKey = `userSleepData_${userId}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData?.timestamp > Date.now() - 21600 * 1000) {
      return cachedData.data;
    }

    // Fetch data from API
    const response = await axios.get(`${API_BASE_URL}/sleep/${userId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      params: { ...config.defaultOptions, ...options },
      timeout: 10000
    });

    // Cache the response
    setCachedData(cacheKey, response.data, 21600);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fetch all sleep data from the API.
 * Implements caching to improve performance.
 * 
 * @param {Object} options - Optional parameters for filtering the results.
 * @returns {Promise<Object>} - Returns all available sleep data.
 */
async function fetchAllSleepData(options = {}) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);

    const { page = 1, limit = 10, ...filters } = options;
    const cacheKey = `allSleepData_page${page}_limit${limit}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData?.timestamp > Date.now() - 21600 * 1000) {
      return cachedData.data;
    }

    const response = await retryRequest(() =>
      axios.get(`${API_BASE_URL}/sleep/all`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        params: { page, limit, ...filters },
        timeout: 15000
      })
    );

    setCachedData(cacheKey, response.data, 21600);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update sleep data for a specific record.
 * 
 * @param {string} recordId - The ID of the sleep data record to update.
 * @param {Object} updateFields - Fields to be updated.
 * @returns {Promise<Object>} - Returns the updated sleep data.
 */
async function updateSleepData(recordId, updateFields) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);
    
    const response = await axios.put(`${API_BASE_URL}/sleep/${recordId}`, updateFields, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fetch sleep statistics for a specific user.
 * 
 * @param {string} userId - The user ID whose sleep statistics are being fetched.
 * @returns {Promise<Object>} - Returns the user's sleep statistics.
 */
async function fetchUserSleepStats(userId) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);

    const response = await axios.get(`${API_BASE_URL}/sleep/stats/${userId}`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

// =============================
// Error Handling
// =============================

/**
 * Handle API errors and return appropriate error messages.
 * 
 * @param {Error} error - The error object thrown during API calls.
 * @throws {ApiError} - Returns a structured API error.
 */
function handleApiError(error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    switch (status) {
      case 400:
        throw new ApiError(data?.message || 'Invalid request parameters', 'bad_request', status);
      case 401:
        throw new AuthError();
      case 404:
        throw new ApiError('Requested resource not found', 'not_found', status);
      case 429:
        throw new ApiError('Too many requests', 'rate_limit_error', status);
      default:
        throw new ApiError(data?.message || `HTTP Error ${status}`, 'http_error', status);
    }
  }
  
  
  // Custom API errors

  // Custom API errors
  if (error instanceof ApiError) {
    error.stack = error.stack + '\n' + new Error().stack;
    throw error;
  }

  if (error.code === 'ECONNABORTED') {
    throw new NetworkError();
  }

  throw new ApiError(error.message || 'Unknown API error', 'unknown_error', 500);
}

/**
 * Delete sleep data by record ID.
 * 
 * @param {string} recordId - The ID of the sleep data record to delete.
 * @returns {Promise<Object>} - Returns a success message.
 */
async function deleteSleepData(recordId) {
  try {
    if (!checkRateLimit()) throw new ApiError('Rate limit exceeded', 'rate_limit_error', 429);
    
    await retryRequest(() =>
      axios.delete(`${API_BASE_URL}/sleep/${recordId}`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        timeout: 15000
      })
    );
    
    return { message: 'Sleep data successfully deleted' };
  } catch (error) {
    return handleApiError(error);
  }
}


// =============================
// Module Exports
// =============================

module.exports = {
  fetchUserSleepData,
  fetchAllSleepData,
  updateSleepData,
  fetchUserSleepStats,
  deleteSleepData,
  ApiError,
  NetworkError,
  AuthError
};
