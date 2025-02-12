const { initialize, getSDK } = require('../src/index');

describe('SleepSDK Initialization', () => {
    
  test('should throw an error if SDK is not initialized', () => {
    expect(() => getSDK()).toThrow('SDK not initialized. Call initialize() first');
  });

  test('should initialize the SDK successfully', async () => {
    const sdk = await initialize({ environment: 'test' });
    expect(sdk).toBeInstanceOf(Object);
  });

  test('should calculate average sleep hours', async () => {
    const sdk = await initialize({ environment: 'test' });
    const sleepData = [
      { duration: 7, sleepQuality: 3 },
      { duration: 8, sleepQuality: 4 },
      { duration: 6, sleepQuality: 2 }
    ];
    const averageSleep = sdk.calculateAverageSleepHours(sleepData);
    expect(averageSleep).toBeCloseTo(7.0, 1);
  });
});
