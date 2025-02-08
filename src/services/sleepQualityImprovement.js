/**
 * Provides personalized sleep quality improvement tips based on user sleep data.
 * @param {Array<Object>} sleepData - Array of sleep entries
 * @returns {Array<string>} An array of personalized tips for improving sleep quality.
 * @throws {Error} If sleepData is not an array or contains invalid entries.
 */
function getSleepQualityImprovementTips(sleepData) {
    if (!Array.isArray(sleepData)) {
      throw new TypeError('Sleep data must be an array');
    }
  
    const tips = [];
  
    // Check for low sleep quality
    const lowQualityEntries = sleepData.filter(entry => entry.sleepQuality < 3);
    if (lowQualityEntries.length > 0) {
      tips.push('Your sleep quality is low. Consider improving your sleep environment and reducing stress.');
    }
  
    // Check for inconsistent sleep schedule
    const bedTimes = sleepData.map(entry => new Date(entry.bedTime).getHours());
    const wakeTimes = sleepData.map(entry => new Date(entry.wakeTime).getHours());
    const bedTimeStdDev = calculateStandardDeviation(bedTimes);
    const wakeTimeStdDev = calculateStandardDeviation(wakeTimes);
  
    if (bedTimeStdDev > 1.5) {
      tips.push('Try to go to bed at the same time every night to improve sleep consistency.');
    }
  
    if (wakeTimeStdDev > 1.5) {
      tips.push('Try to wake up at the same time every morning to improve sleep consistency.');
    }
  
    // Check for short sleep duration
    const averageSleepDuration = sleepData.reduce((acc, entry) => acc + entry.duration, 0) / sleepData.length;
    if (averageSleepDuration < 7) {
      tips.push('You are getting less than 7 hours of sleep on average. Aim for 7-9 hours of sleep per night.');
    }
  
    return tips;
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
    getSleepQualityImprovementTips
  };
  