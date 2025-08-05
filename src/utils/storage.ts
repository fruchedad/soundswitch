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

// In-memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const MEMORY_CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Get a value from storage with memory caching
 */
export async function getStorageValue<T>(key: string): Promise<T | null> {
  try {
    // Check memory cache first
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
      return cached.data as T;
    }

    const result = await chrome.storage.local.get([key]);
    const value = result[key] || null;
    
    // Cache in memory for faster subsequent access
    if (value !== null) {
      memoryCache.set(key, { data: value, timestamp: Date.now() });
    }
    
    return value;
  } catch (error) {
    console.error(`Error getting storage value for ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in storage with memory cache update
 */
export async function setStorageValue<T>(key: string, value: T): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    
    // Update memory cache
    memoryCache.set(key, { data: value, timestamp: Date.now() });
    
    return true;
  } catch (error) {
    console.error(`Error setting storage value for ${key}:`, error);
    return false;
  }
}

/**
 * Get multiple values from storage efficiently
 */
export async function getStorageValues<T>(keys: string[]): Promise<Partial<T>> {
  try {
    // Check memory cache for all keys
    const cachedResults: Partial<T> = {};
    const keysToFetch: string[] = [];
    
    for (const key of keys) {
      const cached = memoryCache.get(key);
      if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL) {
        (cachedResults as any)[key] = cached.data;
      } else {
        keysToFetch.push(key);
      }
    }
    
    // Fetch remaining keys from storage
    let storageResults: Record<string, any> = {};
    if (keysToFetch.length > 0) {
      storageResults = await chrome.storage.local.get(keysToFetch);
      
      // Update memory cache
      for (const key of keysToFetch) {
        if (storageResults[key] !== undefined) {
          memoryCache.set(key, { data: storageResults[key], timestamp: Date.now() });
        }
      }
    }
    
    return { ...cachedResults, ...storageResults } as Partial<T>;
  } catch (error) {
    console.error('Error getting storage values:', error);
    return {} as Partial<T>;
  }
}

/**
 * Set multiple values in storage efficiently
 */
export async function setStorageValues(values: Record<string, any>): Promise<boolean> {
  try {
    await chrome.storage.local.set(values);
    
    // Update memory cache
    const timestamp = Date.now();
    for (const [key, value] of Object.entries(values)) {
      memoryCache.set(key, { data: value, timestamp });
    }
    
    return true;
  } catch (error) {
    console.error('Error setting storage values:', error);
    return false;
  }
}

/**
 * Remove a value from storage with cache cleanup
 */
export async function removeStorageValue(key: string): Promise<boolean> {
  try {
    await chrome.storage.local.remove([key]);
    memoryCache.delete(key);
    return true;
  } catch (error) {
    console.error(`Error removing storage value for ${key}:`, error);
    return false;
  }
}

/**
 * Clear all storage with cache cleanup
 */
export async function clearStorage(): Promise<boolean> {
  try {
    await chrome.storage.local.clear();
    memoryCache.clear();
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
 * Optimized Cache management with LRU implementation
 */
export class CacheManager {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100; // Maximum cache entries
  private static cacheAccessOrder = new Map<string, number>(); // Track access order

  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE);
      if (!cache || !cache[key]) return null;

      const cachedItem = cache[key];
      if (Date.now() - cachedItem.timestamp > this.CACHE_DURATION) {
        // Cache expired, remove it
        delete cache[key];
        this.cacheAccessOrder.delete(key);
        await setStorageValue(STORAGE_KEYS.STATS_CACHE, cache);
        return null;
      }

      // Update access order for LRU
      this.cacheAccessOrder.set(key, Date.now());
      return cachedItem.data as T;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  static async setCachedData<T>(key: string, data: T): Promise<boolean> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE) || {};
      
      // Implement LRU eviction if cache is full
      if (Object.keys(cache).length >= this.MAX_CACHE_SIZE && !cache[key]) {
        await this.evictLeastRecentlyUsed(cache);
      }
      
      cache[key] = {
        data,
        timestamp: Date.now()
      };

      // Update access order
      this.cacheAccessOrder.set(key, Date.now());

      return await setStorageValue(STORAGE_KEYS.STATS_CACHE, cache);
    } catch (error) {
      console.error('Error setting cached data:', error);
      return false;
    }
  }

  /**
   * Evict least recently used cache entries
   */
  private static async evictLeastRecentlyUsed(cache: Record<string, CachedData>): Promise<void> {
    const sortedByAccess = Array.from(this.cacheAccessOrder.entries())
      .sort(([, a], [, b]) => a - b);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(sortedByAccess.length * 0.25) || 1;
    for (let i = 0; i < toRemove; i++) {
      const [keyToRemove] = sortedByAccess[i];
      delete cache[keyToRemove];
      this.cacheAccessOrder.delete(keyToRemove);
    }
  }

  static async clearCache(): Promise<boolean> {
    this.cacheAccessOrder.clear();
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
        } else {
          this.cacheAccessOrder.delete(key);
        }
      }

      await setStorageValue(STORAGE_KEYS.STATS_CACHE, cleanedCache);
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    size: number;
    memorySize: number;
    hitRate: number;
  }> {
    try {
      const cache = await getStorageValue<Record<string, CachedData>>(STORAGE_KEYS.STATS_CACHE);
      return {
        size: cache ? Object.keys(cache).length : 0,
        memorySize: memoryCache.size,
        hitRate: 0 // Could be tracked with counters
      };
    } catch {
      return { size: 0, memorySize: 0, hitRate: 0 };
    }
  }
}

/**
 * Clean up expired memory cache entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (now - value.timestamp > MEMORY_CACHE_TTL) {
      memoryCache.delete(key);
    }
  }
}, MEMORY_CACHE_TTL); 