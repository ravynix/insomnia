const { SleepData } = require('./sleepData');

describe('SleepData Class', () => {
  test('should create a valid instance with correct properties', () => {
    const data = new SleepData('user123', '2023-01-01', 7.5, 4);
    expect(data).toBeInstanceOf(SleepData);
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/); // UUID format validation
    expect(data.userId).toBe('user123');
    expect(data.date).toBe('2023-01-01');
    expect(data.duration).toBe(7.5);
    expect(data.sleepQuality).toBe(4);
  });

  test('should throw an error for invalid duration values', () => {
    expect(() => new SleepData('user123', '2023-01-01', -1, 3))
      .toThrow('Duration must be a number between 0 and 24 hours');
    expect(() => new SleepData('user123', '2023-01-01', 25, 3))
      .toThrow('Duration must be a number between 0 and 24 hours');
  });

  test('should validate correct sleep data', () => {
    const validData = {
      userId: 'user123',
      date: '2023-01-01',
      duration: 7.5,
      sleepQuality: 4
    };
    expect(SleepData.validate(validData)).toBe(true);
  });

  test('should return false for invalid sleep data', () => {
    const invalidData = {
      userId: 'user123',
      date: 'invalid-date',
      duration: 30, // Invalid duration
      sleepQuality: 4
    };
    expect(SleepData.validate(invalidData)).toBe(false);
  });

  test('should convert to JSON correctly with expected properties', () => {
    const data = new SleepData('user123', '2023-01-01', 8, 5);
    const json = data.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('createdAt');
    expect(json).toHaveProperty('userId', 'user123');
    expect(json).toHaveProperty('date', '2023-01-01');
    expect(json).toHaveProperty('duration', 8);
    expect(json).toHaveProperty('sleepQuality', 5);
  });
});
