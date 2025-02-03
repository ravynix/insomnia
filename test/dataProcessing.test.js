const { calculateAverageSleepHours, applyCustomMetrics, calculateSleepDebt, calculateSleepConsistency, generateSleepRecommendations } = require('./dataProcessing');

describe('Data Processing', () => {
  const testData = [
    { duration: 6, sleepQuality: 3, bedTime: '2024-02-01T22:00:00Z', wakeTime: '2024-02-02T06:00:00Z' },
    { duration: 7, sleepQuality: 4, bedTime: '2024-02-02T23:00:00Z', wakeTime: '2024-02-03T07:00:00Z' },
    { duration: 8, sleepQuality: 5, bedTime: '2024-02-03T21:30:00Z', wakeTime: '2024-02-04T05:30:00Z' }
  ];

  describe('calculateAverageSleepHours', () => {
    test('should calculate correct average', () => {
      const avg = calculateAverageSleepHours(testData);
      expect(avg).toBeCloseTo(7.0);
    });

    test('should handle empty data', () => {
      expect(() => calculateAverageSleepHours([])).toThrow();
    });

    test('should apply quality weighting', () => {
      const weightedData = [
        { duration: 6, sleepQuality: 1 },
        { duration: 6, sleepQuality: 5 }
      ];
      const avg = calculateAverageSleepHours(weightedData);
      expect(avg).toBeCloseTo(6.0); // (6*1 + 6*5) / (1+5) = 6
    });
  });

  describe('applyCustomMetrics', () => {
    const rules = {
      minQuality: 3,
      maxDuration: 8,
      requiredStages: ['deep']
    };

    test('should filter data correctly', () => {
      const filtered = applyCustomMetrics(testData, rules);
      expect(filtered.length).toBe(2);
    });

    test('should handle invalid rules', () => {
      expect(() => applyCustomMetrics(testData, { minQuality: 'invalid' })).toThrow();
    });
  });

  describe('calculateSleepDebt', () => {
    test('should calculate correct sleep debt', () => {
      const debt = calculateSleepDebt(testData, 8);
      expect(debt).toBeCloseTo(3.0); // Ideal: 24, Actual: 21
    });
  });

  describe('calculateSleepConsistency', () => {
    test('should compute consistency metrics', () => {
      const consistency = calculateSleepConsistency(testData);
      expect(consistency).toHaveProperty('bedTimeStdDev');
      expect(consistency).toHaveProperty('wakeTimeStdDev');
    });
  });

  describe('generateSleepRecommendations', () => {
    test('should suggest improvements if sleep is insufficient', () => {
      const recommendations = generateSleepRecommendations(testData);
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});