const { getCachedData, setCachedData, clearHistoricalCache } = require('./cache');

describe('Cache System', () => {
  beforeEach(() => {
    clearHistoricalCache();
  });

  test('should set and get cached data', () => {
    setCachedData('test', { value: 42 }, 60);
    const data = getCachedData('test');
    expect(data.value).toBe(42);
  });

  test('should expire data after TTL', async () => {
    setCachedData('temp', { data: 'test' }, 1);
    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(getCachedData('temp')).toBeUndefined();
  });

  test('should clear cache by pattern', () => {
    setCachedData('user:123', {});
    setCachedData('config:main', {});
    clearHistoricalCache('user:*');
    expect(getCachedData('user:123')).toBeUndefined();
    expect(getCachedData('config:main')).toBeDefined();
  });
});