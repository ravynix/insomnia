const { initialize, getSDK } = require('./index');

describe('SDK', () => {
  beforeAll(async () => {
    await initialize({ environment: 'test' });
  });

  test('should initialize correctly', () => {
    const sdk = getSDK();
    expect(sdk).toHaveProperty('fetchUserSleepData');
    expect(sdk).toHaveProperty('calculateAverageSleepHours');
  });

  test('should prevent uninitialized access', () => {
    jest.resetModules();
    const { getSDK } = require('./index');
    expect(() => getSDK()).toThrow('Call initialize() first');
  });
});