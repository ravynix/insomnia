const { setCachedData, getCachedData, clearExpiredCache, getCacheStats } = require('../src/services/cache');

describe('Cache Service', () => {
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

  test('should clear expired cache entries', async () => {
    setCachedData('expired', { data: 'test' }, 1);
    setCachedData('valid', { data: 'test' }, 60);
    await new Promise(resolve => setTimeout(resolve, 1500));
    clearExpiredCache();
    expect(getCachedData('expired')).toBeUndefined();
    expect(getCachedData('valid')).toBeDefined();
  });

  test('should return correct cache statistics', () => {
    setCachedData('test1', { value: 1 }, 60);
    setCachedData('test2', { value: 2 }, 60);
    getCachedData('test1');
    getCachedData('test3'); // miss
    const stats = getCacheStats();
    expect(stats.sets).toBe(2);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });
});