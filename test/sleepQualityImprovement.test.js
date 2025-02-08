const { getSleepQualityImprovementTips } = require('../src/services/sleepQualityImprovement');

describe('Sleep Quality Improvement', () => {
  const testData = [
    { duration: 6, sleepQuality: 2, bedTime: '2024-02-01T22:00:00Z', wakeTime: '2024-02-02T06:00:00Z' },
    { duration: 7, sleepQuality: 4, bedTime: '2024-02-02T23:00:00Z', wakeTime: '2024-02-03T07:00:00Z' },
    { duration: 8, sleepQuality: 5, bedTime: '2024-02-03T21:30:00Z', wakeTime: '2024-02-04T05:30:00Z' }
  ];

  test('should provide tips for low sleep quality', () => {
    const tips = getSleepQualityImprovementTips(testData);
    expect(tips).toContain('Your sleep quality is low. Consider improving your sleep environment and reducing stress.');
  });

  test('should provide tips for inconsistent sleep schedule', () => {
    const tips = getSleepQualityImprovementTips(testData);
    expect(tips).toContain('Try to go to bed at the same time every night to improve sleep consistency.');
    expect(tips).toContain('Try to wake up at the same time every morning to improve sleep consistency.');
  });

  test('should provide tips for short sleep duration', () => {
    const tips = getSleepQualityImprovementTips(testData);
    expect(tips).toContain('You are getting less than 7 hours of sleep on average. Aim for 7-9 hours of sleep per night.');
  });

  test('should handle empty data', () => {
    expect(() => getSleepQualityImprovementTips([])).toThrow();
  });
});
