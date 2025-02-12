process.env.INSOMNIA_API_KEY = 'your-api-key-here';

const { getSleepQualityImprovementTips } = require('../src/services/sleepQualityImprovement');

describe('Sleep Quality Improvement', () => {
  const testData = [
    { duration: 6, sleepQuality: 2 },
    { duration: 5, sleepQuality: 1 },
    { duration: 7, sleepQuality: 3 }
  ];

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
