const { calculateAverageSleepHours, applyCustomMetrics } = require('./dataProcessing');

describe('Data Processing', () => {
  const testData = [
    { duration: 6, sleepQuality: 3 },
    { duration: 7, sleepQuality: 4 },
    { duration: 8, sleepQuality: 5 }
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
});

