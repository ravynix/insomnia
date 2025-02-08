const { analyzeSleepPatterns } = require('../src/services/sleepAnalysis');

describe('Sleep Analysis', () => {
  const testData = [
    { sleepStart: 1612137600000, sleepEnd: 1612173600000, bedTime: '2024-02-01T22:00:00Z', wakeTime: '2024-02-02T06:00:00Z' },
    { sleepStart: 1612224000000, sleepEnd: 1612260000000, bedTime: '2024-02-02T23:00:00Z', wakeTime: '2024-02-03T07:00:00Z' },
    { sleepStart: 1612310400000, sleepEnd: 1612346400000, bedTime: '2024-02-03T21:30:00Z', wakeTime: '2024-02-04T05:30:00Z' }
  ];

  test('should detect inconsistent bedtimes', () => {
    const result = analyzeSleepPatterns(testData);
    expect(result.inconsistentBedTimes).toBe(true);
    expect(result.suggestions).toContain('Try to go to bed at the same time every night.');
  });

  test('should detect inconsistent wake times', () => {
    const result = analyzeSleepPatterns(testData);
    expect(result.inconsistentWakeTimes).toBe(true);
    expect(result.suggestions).toContain('Try to wake up at the same time every morning.');
  });

  test('should detect irregular sleep durations', () => {
    const result = analyzeSleepPatterns(testData);
    expect(result.irregularDurations).toBe(true);
    expect(result.suggestions).toContain('Try to maintain a consistent sleep duration each night.');
  });

  test('should handle empty data', () => {
    expect(() => analyzeSleepPatterns([])).toThrow();
  });
});
