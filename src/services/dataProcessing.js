/**
 * Calculates weighted average sleep hours with safety checks
 * @param {Array<Object>} sleepData - Array of sleep entries
 * @param {Object} [options] - Calculation options
 * @param {boolean} [options.roundResult=true] - Round to 2 decimals
 * @param {number} [options.minimumEntries=3] - Minimum required data points
 * @returns {number} Weighted average in hours
 * @throws {Error} For invalid input or insufficient data
 */
function calculateAverageSleepHours(sleepData, options = {}) {
  const { roundResult = true, minimumEntries = 3 } = options;
  
  // Input validation
  if (!Array.isArray(sleepData)) {
    throw new TypeError('Sleep data must be an array');
  }
  
  if (sleepData.length < minimumEntries) {
    throw new Error(`Insufficient data points (minimum ${minimumEntries} required)`);
  }

  // Validation pipeline
  const validEntries = sleepData.filter(entry => {
    const isValid = typeof entry?.duration === 'number' && entry.duration > 0;
    if (!isValid) console.warn('Invalid sleep entry detected:', entry);
    return isValid;
  });

  if (validEntries.length === 0) {
    throw new Error('No valid sleep entries found');
  }

  // Weighted calculation
  const totalHours = validEntries.reduce((acc, entry) => {
    const weight = entry.sleepQuality || 1; // Quality-based weighting
    return acc + (entry.duration * weight);
  }, 0);

  const totalWeight = validEntries.reduce((acc, entry) => 
    acc + (entry.sleepQuality || 1), 0);

  let average = totalHours / totalWeight;
  
  return roundResult ? Number(average.toFixed(2)) : average;
}

/**
 * Advanced data filtering with multiple metric support
 * @param {Array<Object>} sleepData - Raw sleep data array
 * @param {Object} customRules - Filtering criteria
 * @param {Object} [config] - Processing configuration
 * @param {boolean} [config.strictMode=false] - Enable strict validation
 * @returns {Array<Object>} Filtered and transformed dataset
 * @throws {Error} For invalid rules or data structure
 */
function applyCustomMetrics(sleepData, customRules, config = {}) {
  const DEFAULT_RULES = {
    minQuality: 2,
    maxDuration: 12,
    requiredStages: ['deep', 'rem']
  };

  const mergedRules = { ...DEFAULT_RULES, ...customRules };
  
  // Rule validation
  if (typeof mergedRules.minQuality !== 'number' || mergedRules.minQuality < 0) {
    throw new Error('Invalid quality threshold in rules');
  }

  // Data structure validation
  if (config.strictMode) {
    const sampleEntry = sleepData[0];
    if (!sampleEntry?.hasOwnProperty('sleepQuality')) {
      throw new Error('Data missing required sleepQuality field');
    }
  }

  // Multi-stage filtering
  return sleepData
    .map(entry => ({
      ...entry,
      duration: Number(entry.duration.toFixed(2)) // Normalize duration
    }))
    .filter(entry => {
      const qualityPass = entry.sleepQuality >= mergedRules.minQuality;
      const durationPass = entry.duration <= mergedRules.maxDuration;
      const stagePass = mergedRules.requiredStages.every(stage => 
        entry.sleepStages?.includes(stage)
      );
      
      return qualityPass && durationPass && stagePass;
    })
    .sort((a, b) => b.sleepQuality - a.sleepQuality); // Quality descending sort
}

function calculateSleepDebt(sleepData, targetHours = 8) {
  // Calculate total sleep duration from sleep data
  const totalSleep = sleepData.reduce((acc, entry) => acc + entry.duration, 0);
  const totalDays = sleepData.length;
  const idealSleep = totalDays * targetHours;
  
  // Return sleep debt (difference between ideal and actual sleep)
  return idealSleep - totalSleep;
}

function calculateSleepConsistency(sleepData) {
  // Extract bedtimes and wake times from sleep data
  const bedTimes = sleepData.map(entry => new Date(entry.bedTime).getHours());
  const wakeTimes = sleepData.map(entry => new Date(entry.wakeTime).getHours());
  
  // Calculate standard deviation for bedtimes and wake times
  const bedTimeStdDev = calculateStandardDeviation(bedTimes);
  const wakeTimeStdDev = calculateStandardDeviation(wakeTimes);
  
  return { bedTimeStdDev, wakeTimeStdDev };
}

function generateSleepRecommendations(sleepData) {
  // Calculate the average sleep duration from the provided sleep data
  const averageSleep = calculateAverageSleepHours(sleepData);
  const recommendations = [];

  // If the average sleep is less than 6 hours, recommend increasing sleep duration
  if (averageSleep < 6) {
    recommendations.push('You may not be getting enough sleep. Try to sleep 7-9 hours per night.');
  }

  // If any sleep entry has a sleep quality rating below 2, suggest improving sleep habits
  if (sleepData.some(entry => entry.sleepQuality < 2)) {
    recommendations.push('Your sleep quality is low. Avoid caffeine before bedtime.');
  }

  return recommendations;
}

/**
 * Generates a comprehensive sleep report based on provided sleep data.
 * @param {Array<Object>} sleepData - Array of sleep entries
 * @param {number} [targetHours=8] - Target sleep hours per day for sleep debt calculation
 * @returns {Object} A sleep report containing average sleep hours, sleep debt, sleep consistency, and recommendations.
 * @throws {Error} For invalid input or calculation errors
 */
function generateSleepReport(sleepData, targetHours = 8) {
  // Calculate average sleep hours
  const averageSleep = calculateAverageSleepHours(sleepData);
  
  // Calculate sleep debt based on the target hours
  const sleepDebt = calculateSleepDebt(sleepData, targetHours);
  
  // Calculate sleep consistency (standard deviation for bed and wake times)
  const consistency = calculateSleepConsistency(sleepData);
  
  // Generate personalized sleep recommendations
  const recommendations = generateSleepRecommendations(sleepData);
  
  return {
    averageSleep,
    sleepDebt,
    consistency,
    recommendations
  };
}

module.exports = {
  calculateAverageSleepHours,
  applyCustomMetrics,
  calculateSleepDebt,
  calculateSleepConsistency,
  generateSleepRecommendations,
  generateSleepReport  // Newly added feature
};
