import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStorageValue,
  setStorageValue,
  getStorageValues,
  removeStorageValue,
  clearStorage,
  initializeStorage,
  CacheManager,
  DEFAULT_STORAGE
} from '../../src/utils/storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chrome.storage.local mock
    ((global.chrome.storage.local.get as any) as any).mockReset();
    ((global.chrome.storage.local.set as any) as any).mockReset();
    ((global.chrome.storage.local.remove as any) as any).mockReset();
    ((global.chrome.storage.local.clear as any) as any).mockReset();
  });

  describe('getStorageValue', () => {
    it('should get a value from storage', async () => {
      const mockData = { testKey: 'testValue' };
      (global.chrome.storage.local.get as any).mockResolvedValue(mockData);

      const result = await getStorageValue('testKey');
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['testKey']);
      expect(result).toBe('testValue');
    });

    it('should return null if key does not exist', async () => {
      (global.chrome.storage.local.get as any).mockResolvedValue({});

      const result = await getStorageValue('nonExistentKey');
      
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (global.chrome.storage.local.get as any).mockRejectedValue(new Error('Storage error'));

      const result = await getStorageValue('testKey');
      
      expect(result).toBeNull();
    });
  });

  describe('setStorageValue', () => {
    it('should set a value in storage', async () => {
      (global.chrome.storage.local.set as any).mockResolvedValue(undefined);

      await setStorageValue('testKey', 'testValue');
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ testKey: 'testValue' });
    });

    it('should handle errors gracefully', async () => {
      (global.chrome.storage.local.set as any).mockRejectedValue(new Error('Storage error'));

      // Should not throw and returns false on error
      const result = await setStorageValue('testKey', 'testValue');
      expect(result).toBe(false);
    });
  });

  describe('getStorageValues', () => {
    it('should get multiple values from storage', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      (global.chrome.storage.local.get as any).mockResolvedValue(mockData);

      const result = await getStorageValues(['key1', 'key2']);
      
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toEqual(mockData);
    });

    it('should return empty object on error', async () => {
      (global.chrome.storage.local.get as any).mockRejectedValue(new Error('Storage error'));

      const result = await getStorageValues(['key1', 'key2']);
      
      expect(result).toEqual({});
    });
  });

  describe('removeStorageValue', () => {
    it('should remove a value from storage', async () => {
      (global.chrome.storage.local.remove as any).mockResolvedValue(undefined);

      await removeStorageValue('testKey');
      
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(['testKey']);
    });

    it('should handle errors gracefully', async () => {
      (global.chrome.storage.local.remove as any).mockRejectedValue(new Error('Storage error'));

      // Should not throw and returns false on error
      const result = await removeStorageValue('testKey');
      expect(result).toBe(false);
    });
  });

  describe('clearStorage', () => {
    it('should clear all storage', async () => {
      (global.chrome.storage.local.clear as any).mockResolvedValue(undefined);

      await clearStorage();
      
      expect(chrome.storage.local.clear).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      (global.chrome.storage.local.clear as any).mockRejectedValue(new Error('Storage error'));

      // Should not throw and returns false on error
      const result = await clearStorage();
      expect(result).toBe(false);
    });
  });

  describe('initializeStorage', () => {
    it('should initialize storage with defaults if empty', async () => {
      (global.chrome.storage.local.get as any).mockResolvedValue({});
      (global.chrome.storage.local.set as any).mockResolvedValue(undefined);

      await initializeStorage();
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(DEFAULT_STORAGE);
    });

    it('should not overwrite existing values', async () => {
      const existingData = { 
        viewMode: 'public',
        darkMode: true,
        statsCache: {},
        accounts: {},
        activeAccount: null
      };
      (global.chrome.storage.local.get as any).mockResolvedValue(existingData);

      await initializeStorage();
      
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });
});

describe('CacheManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.chrome.storage.local.get as any).mockReset();
    (global.chrome.storage.local.set as any).mockReset();
  });

  describe('getCachedData', () => {
    it('should return cached data if not expired', async () => {
      const cachedData = {
        data: { test: 'value' },
        timestamp: Date.now() - 1000 // 1 second ago
      };
      
      (global.chrome.storage.local.get as any).mockResolvedValue({
        statsCache: { testKey: cachedData }
      });

      const result = await CacheManager.getCachedData('testKey');
      
      expect(result).toEqual({ test: 'value' });
    });

    it('should return null if cache is expired', async () => {
      const cachedData = {
        data: { test: 'value' },
        timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes ago
      };
      
      (global.chrome.storage.local.get as any).mockResolvedValue({
        statsCache: { testKey: cachedData }
      });

      const result = await CacheManager.getCachedData('testKey');
      
      expect(result).toBeNull();
    });

    it('should return null if no cache exists', async () => {
      (global.chrome.storage.local.get as any).mockResolvedValue({});

      const result = await CacheManager.getCachedData('testKey');
      
      expect(result).toBeNull();
    });
  });

  describe('setCachedData', () => {
    it('should set cached data with timestamp', async () => {
      (global.chrome.storage.local.get as any).mockResolvedValue({ statsCache: {} });
      (global.chrome.storage.local.set as any).mockResolvedValue(undefined);

      const testData = { test: 'value' };
      await CacheManager.setCachedData('testKey', testData);
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        statsCache: {
          testKey: {
            data: testData,
            timestamp: expect.any(Number)
          }
        }
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', async () => {
      (global.chrome.storage.local.set as any).mockResolvedValue(undefined);

      await CacheManager.clearCache();
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ statsCache: {} });
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired cache entries', async () => {
      const cache = {
        validKey: {
          data: { test: 'valid' },
          timestamp: Date.now() - 1000 // 1 second ago
        },
        expiredKey: {
          data: { test: 'expired' },
          timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes ago
        }
      };
      
      (global.chrome.storage.local.get as any).mockResolvedValue({ statsCache: cache });
      (global.chrome.storage.local.set as any).mockResolvedValue(undefined);

      await CacheManager.cleanupExpiredCache();
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        statsCache: {
          validKey: cache.validKey
        }
      });
    });
  });
}); 