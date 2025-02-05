const { calculateAverageSleepHours, calculateSleepDebt, calculateSleepConsistency, generateSleepRecommendations, calculateSleepDurations, generateSleepReport } = require('../src/services/dataProcessing');

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
  });

  describe('calculateSleepDurations', () => {
    test('should calculate longest and shortest sleep durations', () => {
      const durations = calculateSleepDurations(testData);
      expect(durations.longestSleep).toBe(8 * 60 * 60 * 1000); // 8 hours in milliseconds
      expect(durations.shortestSleep).toBe(6 * 60 * 60 * 1000); // 6 hours in milliseconds
    });

    test('should handle empty data', () => {
      expect(() => calculateSleepDurations([])).toThrow();
    });
  });

  describe('generateSleepReport', () => {
    test('should generate a comprehensive sleep report', () => {
      const report = generateSleepReport(testData);
      expect(report.averageSleep).toBeCloseTo(7.0);
      expect(report.sleepDebt).toBeCloseTo(3.0); // Assuming targetHours is 8
      expect(report.consistency).toBeDefined();
      expect(report.sleepDurations.longestSleep).toBe(8 * 60 * 60 * 1000); // 8 hours in milliseconds
      expect(report.sleepDurations.shortestSleep).toBe(6 * 60 * 60 * 1000); // 6 hours in milliseconds
      expect(report.recommendations).toBeDefined();
    });

    test('should handle empty data', () => {
      expect(() => generateSleepReport([])).toThrow();
    });
  });
});