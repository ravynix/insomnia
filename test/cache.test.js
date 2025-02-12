process.env.INSOMNIA_API_KEY = 'your-api-key-here';

const { getCachedData, setCachedData, clearNamespaceCache, getCacheStats } = require('../src/services/cache');

describe('Cache Service', () => {
  test('should set and get cached data', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };
    setCachedData(key, value);
    const cachedValue = await getCachedData(key);
    expect(cachedValue).toEqual(value);
  });

  test('should clear namespace cache', async () => {
    const namespace = 'testNamespace';
    setCachedData(`${namespace}:key1`, 'value1');
    setCachedData(`${namespace}:key2`, 'value2');
    const deletedCount = clearNamespaceCache(namespace);
    expect(deletedCount).toBe(2);
    const cachedValue1 = await getCachedData(`${namespace}:key1`);
    const cachedValue2 = await getCachedData(`${namespace}:key2`);
    expect(cachedValue1).toBeNull();
    expect(cachedValue2).toBeNull();
  });

  test('should get cache stats', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
  });
});