/**
 * Analyzes sleep patterns to detect irregularities such as inconsistent sleep times or durations.
 * @param {Array<Object>} sleepData - Array of sleep entries
 * @returns {Object} An object containing detected irregularities and suggestions for improvement.
 * @throws {Error} If sleepData is not an array or contains invalid entries.
 */
function analyzeSleepPatterns(sleepData) {
    if (!Array.isArray(sleepData)) {
      throw new TypeError('Sleep data must be an array');
    }
  
    const irregularities = {
      inconsistentBedTimes: false,
      inconsistentWakeTimes: false,
      irregularDurations: false,
      suggestions: []
    };
  
    // Extract bedtimes and wake times from sleep data
    const bedTimes = sleepData.map(entry => new Date(entry.bedTime).getHours());
    const wakeTimes = sleepData.map(entry => new Date(entry.wakeTime).getHours());
    const durations = sleepData.map(entry => entry.sleepEnd - entry.sleepStart);
  
    // Calculate standard deviation for bedtimes, wake times, and durations
    const bedTimeStdDev = calculateStandardDeviation(bedTimes);
    const wakeTimeStdDev = calculateStandardDeviation(wakeTimes);
    const durationStdDev = calculateStandardDeviation(durations);
  
    // Detect inconsistencies
    if (bedTimeStdDev > 1.5) {
      irregularities.inconsistentBedTimes = true;
      irregularities.suggestions.push('Try to go to bed at the same time every night.');
    }
  
    if (wakeTimeStdDev > 1.5) {
      irregularities.inconsistentWakeTimes = true;
      irregularities.suggestions.push('Try to wake up at the same time every morning.');
    }
  
    if (durationStdDev > 1.5) {
      irregularities.irregularDurations = true;
      irregularities.suggestions.push('Try to maintain a consistent sleep duration each night.');
    }
  
    return irregularities;
  }
  
  /**
   * Calculates the standard deviation of an array of numbers.
   * @param {Array<number>} values - Array of numbers
   * @returns {number} The standard deviation of the numbers
   */
  function calculateStandardDeviation(values) {
    const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  module.exports = {
    analyzeSleepPatterns
  };
  