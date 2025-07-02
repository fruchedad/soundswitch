import type { StorageData, CachedData } from '../types';

// Storage keys
export const STORAGE_KEYS = {
  VIEW_MODE: 'viewMode',
  DARK_MODE: 'darkMode',
  STATS_CACHE: 'statsCache',
  ACCOUNTS: 'accounts',
  ACTIVE_ACCOUNT: 'activeAccount',
  VIEW_SETTINGS: 'viewSettings'
} as const;

// Default storage values
export const DEFAULT_STORAGE: Partial<StorageData> = {
  viewMode: 'user',
  darkMode: false,
  statsCache: {},
  accounts: {},
  activeAccount: null
};

/**
 * Get a value from storage
 */
export async function getStorageValue<T>(key: string): Promise<T | null> {
  try {
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error(`Error getting storage value for ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in storage
 */
export async function setStorageValue<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (error) {
    console.error(`Error setting storage value for ${key}:`, error);
    return false;
  }
}

/**
 * Get multiple values from storage
 */
export async function getStorageValues<T>(keys: string[]): Promise<Partial<T>> {
  try {
    return await chrome.storage.local.get(keys) as Partial<T>;
  } catch (error) {
    console.error('Error getting storage values:', error);
    return {} as Partial<T>;
  }
}

/**
 * Set multiple values in storage
 */
export async function setStorageValues(values: Record<string, any>): Promise<boolean> {
  try {
    await chrome.storage.local.set(values);
    return true;
  } catch (error) {
    console.error('Error setting storage values:', error);
    return false;
  }
}

/**
 * Remove a value from storage
 */
export async function removeStorageValue(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove([key]);
    return true;
  } catch (error) {
    console.error(`Error removing storage value for ${key}:`, error);
    return false;
  }
}

/**
 * Clear all storage
 */
export async function clearStorage(): Promise<boolean> {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

/**
 * Initialize storage with default values
 */
export async function initializeStorage(): Promise<void> {
  try {
    const currentStorage = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
    
    const updates: Partial<StorageData> = {};
    
    // Set default values for missing keys
    for (const [key, defaultValue] of Object.entries(DEFAULT_STORAGE)) {
      if (currentStorage[key] === undefined) {
        updates[key as keyof StorageData] = defaultValue as any;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await chrome.storage.local.set(updates);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Cache management utilities
 */
export class CacheManager {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE);
      if (!cache || !cache[key]) return null;

      const cachedItem = cache[key];
      if (Date.now() - cachedItem.timestamp > this.CACHE_DURATION) {
        // Cache expired, remove it
        delete cache[key];
        await setStorageValue(STORAGE_KEYS.STATS_CACHE, cache);
        return null;
      }

      return cachedItem.data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  static async setCachedData<T>(key: string, data: T): Promise<boolean> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE) || {};
      
      cache[key] = {
        data,
        timestamp: Date.now()
      };

      return await setStorageValue(STORAGE_KEYS.STATS_CACHE, cache);
    } catch (error) {
      console.error('Error setting cached data:', error);
      return false;
    }
  }

  static async clearCache(): Promise<boolean> {
    return await setStorageValue(STORAGE_KEYS.STATS_CACHE, {});
  }

  static async cleanupExpiredCache(): Promise<void> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE);
      if (!cache) return;

      const now = Date.now();
      const cleanedCache: Record<string, CachedData> = {};

      for (const [key, value] of Object.entries(cache)) {
        if (value && value.timestamp && now - value.timestamp < this.CACHE_DURATION) {
          cleanedCache[key] = value;
        }
      }

      await setStorageValue(STORAGE_KEYS.STATS_CACHE, cleanedCache);
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }
} 