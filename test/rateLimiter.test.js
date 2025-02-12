const { checkRateLimit, resetRateLimiter } = require('../src/services/rateLimiter');

describe('Rate Limiter', () => {
  beforeEach(() => {
    resetRateLimiter(true);
  });

  test('should allow requests under limit', () => {
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit().allowed).toBe(true);
    }
  });

  test('should block after limit exceeded', () => {
    for (let i = 0; i < 11; i++) checkRateLimit();
    const result = checkRateLimit();
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeDefined();
  });

  test('should reset after window', async () => {
    for (let i = 0; i < 11; i++) checkRateLimit();
    await new Promise(resolve => setTimeout(resolve, 61000));
    expect(checkRateLimit().allowed).toBe(true);
  });
});