process.env.INSOMNIA_API_KEY = 'your-api-key-here';

const { analyzeSleepPatterns } = require('../src/services/sleepAnalysis');

describe('Sleep Analysis', () => {
  const testData = [
    { duration: 6, sleepQuality: 3, bedTime: '2024-02-01T22:00:00Z', wakeTime: '2024-02-02T06:00:00Z' },
    { duration: 7, sleepQuality: 4, bedTime: '2024-02-02T23:00:00Z', wakeTime: '2024-02-03T07:00:00Z' },
    { duration: 8, sleepQuality: 5, bedTime: '2024-02-03T21:30:00Z', wakeTime: '2024-02-04T05:30:00Z' }
  ];

  test('should detect inconsistent bedtimes', () => {
    const result = analyzeSleepPatterns(testData);
    expect(result.inconsistentBedTimes).toBe(false);
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
