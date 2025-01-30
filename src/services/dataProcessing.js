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
  
  module.exports = {
    calculateAverageSleepHours,
    applyCustomMetrics
  };