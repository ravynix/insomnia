/**
 * Provides personalized sleep quality improvement tips based on user sleep data.
 * @param {Array<Object>} sleepData - Array of sleep entries
 * @returns {Array<string>} An array of personalized tips for improving sleep quality.
 * @throws {Error} If sleepData is not an array or contains invalid entries.
 */
function getSleepQualityImprovementTips(sleepData) {
  if (!Array.isArray(sleepData) || sleepData.length === 0) {
      throw new Error('Sleep data must be a non-empty array');
  }

  const tips = [];

  // Check for low sleep quality
  const lowQualityEntries = sleepData.filter(entry => entry.sleepQuality < 3);
  if (lowQualityEntries.length > 0) {
      tips.push('Your sleep quality is low. Consider improving your sleep environment and reducing stress.');
  }

  // Check for inconsistent sleep schedule
  const bedTimes = sleepData
      .filter(entry => entry.bedTime)
      .map(entry => new Date(entry.bedTime).getHours());
  const wakeTimes = sleepData
      .filter(entry => entry.wakeTime)
      .map(entry => new Date(entry.wakeTime).getHours());

  // If there is insufficient bedTime data or high variability, push the tip
  if (bedTimes.length < 2 || calculateStandardDeviation(bedTimes) > 1.5) {
      tips.push('Try to go to bed at the same time every night to improve sleep consistency.');
  }
  // If there is insufficient wakeTime data or high variability, push the tip
  if (wakeTimes.length < 2 || calculateStandardDeviation(wakeTimes) > 1.5) {
      tips.push('Try to wake up at the same time every morning to improve sleep consistency.');
  }

  // Check for short sleep duration
  const totalDuration = sleepData.reduce((acc, entry) => acc + entry.duration, 0);
  const averageSleepDuration = totalDuration / sleepData.length;
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
  if (values.length === 0) return 0;
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

module.exports = {
  getSleepQualityImprovementTips
};
