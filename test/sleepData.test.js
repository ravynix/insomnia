const { SleepData } = require('./sleepData');

describe('SleepData Class', () => {
  test('should create valid instance', () => {
    const data = new SleepData('user123', '2023-01-01', 7.5, 4);
    expect(data).toBeInstanceOf(SleepData);
    expect(data.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.duration).toBe(7.5);
  });

  test('should throw error for invalid duration', () => {
    expect(() => {
      new SleepData('user123', '2023-01-01', 25, 3);
    }).toThrow('Duration must be a number between 0 and 24 hours');
  });

  test('should validate correct data', () => {
    const testData = {
      userId: 'user123',
      date: '2023-01-01',
      duration: 7.5,
      sleepQuality: 4
    };
    expect(SleepData.validate(testData)).toBe(true);
  });

  test('should convert to JSON correctly', () => {
    const data = new SleepData('user123', new Date(), 8, 5);
    const json = data.toJSON();
    expect(json).toHaveProperty('id');
    expect(json).toHaveProperty('createdAt');
    expect(typeof json.date).toBe('string');
  });
});
