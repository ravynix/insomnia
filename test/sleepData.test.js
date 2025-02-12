const axios = require('axios');
const { 
  fetchUserSleepData, 
  fetchAllSleepData, 
  updateSleepData, 
  fetchUserSleepStats, 
  deleteSleepData 
} = require('../src/services/sleepData');

jest.mock('axios');
jest.mock('../src/services/cache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
}));

const { getCachedData, setCachedData } = require('../src/services/cache');

describe('SleepData API Service', () => {
  const mockUserId = 'user123';
  const mockRecordId = 'record123';
  const mockData = { sleepData: [{ date: '2023-01-01', duration: 7.5, sleepQuality: 4 }] };
  const mockStats = { averageDuration: 7, averageQuality: 4 };

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  test('fetchUserSleepData should return cached data if available', async () => {
    getCachedData.mockReturnValue({ data: mockData, timestamp: Date.now() });

    const result = await fetchUserSleepData(mockUserId);
    expect(result).toEqual(mockData);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('fetchUserSleepData should fetch from API if no cache available', async () => {
    getCachedData.mockReturnValue(null);
    axios.get.mockResolvedValue({ data: mockData });

    const result = await fetchUserSleepData(mockUserId);
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(`/sleep/${mockUserId}`), expect.any(Object));
    expect(setCachedData).toHaveBeenCalled(); 
  });

  test('fetchAllSleepData should return sleep data with pagination', async () => {
    axios.get.mockResolvedValue({ data: mockData });

    const result = await fetchAllSleepData({ page: 1, limit: 5 });
    expect(result).toEqual(mockData);
    expect(axios.get).toHaveBeenCalled();
  });

  test('updateSleepData should send correct PUT request', async () => {
    const updateFields = { duration: 8 };
    axios.put.mockResolvedValue({ data: { ...mockData, ...updateFields } });

    const result = await updateSleepData(mockRecordId, updateFields);
    expect(result).toMatchObject(updateFields);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining(`/sleep/${mockRecordId}`), updateFields, expect.any(Object));
  });

  test('fetchUserSleepStats should return user sleep statistics', async () => {
    axios.get.mockResolvedValue({ data: mockStats });

    const result = await fetchUserSleepStats(mockUserId);
    expect(result).toEqual(mockStats);
  });

  test('deleteSleepData should send correct DELETE request', async () => {
    axios.delete.mockResolvedValue({});

    const result = await deleteSleepData(mockRecordId);
    expect(result).toEqual({ message: 'Sleep data successfully deleted' });
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining(`/sleep/${mockRecordId}`), expect.any(Object));
  });
});
