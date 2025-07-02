import type { SoundCloudUser, FollowerGrowth } from '../types';
import { CacheManager } from './storage';

const SOUNDCLOUD_API_BASE = 'https://api-v2.soundcloud.com';

/**
 * API error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make an authenticated API request
 */
async function makeAPIRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${SOUNDCLOUD_API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new APIError(
        `API request failed: ${response.statusText}`,
        response.status,
        await response.text()
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<SoundCloudUser | null> {
  try {
    return await makeAPIRequest<SoundCloudUser>('/me');
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 401) {
      // Not authenticated
      return null;
    }
    throw error;
  }
}

/**
 * Get user data by ID
 */
export async function getUserData(userId: string | number): Promise<SoundCloudUser | null> {
  const cacheKey = `user_${userId}`;
  
  // Check cache first
  const cached = await CacheManager.getCachedData<SoundCloudUser>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const userData = await makeAPIRequest<SoundCloudUser>(`/users/${userId}`);
    
    // Cache the result
    await CacheManager.setCachedData(cacheKey, userData);
    
    return userData;
  } catch (error) {
    console.error(`Error fetching user data for ${userId}:`, error);
    return null;
  }
}

/**
 * Calculate follower growth statistics
 */
export async function getFollowerGrowth(userId: string | number): Promise<FollowerGrowth | null> {
  const cacheKey = `growth_${userId}`;
  
  // Check cache first
  const cached = await CacheManager.getCachedData<FollowerGrowth>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Get current user data
    const userData = await getUserData(userId);
    if (!userData || !userData.followers_count) {
      return null;
    }

    // In a real implementation, we would track historical data
    // For now, we'll simulate growth data
    const currentFollowers = userData.followers_count;
    const weeklyGrowth = Math.floor(currentFollowers * 0.02); // Simulate 2% weekly growth
    const growthRate = (weeklyGrowth / currentFollowers) * 100;

    const growth: FollowerGrowth = {
      total: currentFollowers,
      newThisWeek: weeklyGrowth,
      growthRate: Math.round(growthRate * 100) / 100,
    };

    // Cache the result
    await CacheManager.setCachedData(cacheKey, growth);

    return growth;
  } catch (error) {
    console.error(`Error calculating follower growth for ${userId}:`, error);
    return null;
  }
}

/**
 * Get user tracks
 */
export async function getUserTracks(
  userId: string | number,
  limit: number = 20
): Promise<any[]> {
  const cacheKey = `tracks_${userId}_${limit}`;
  
  // Check cache first
  const cached = await CacheManager.getCachedData<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const tracks = await makeAPIRequest<any[]>(`/users/${userId}/tracks?limit=${limit}`);
    
    // Cache the result
    await CacheManager.setCachedData(cacheKey, tracks);
    
    return tracks;
  } catch (error) {
    console.error(`Error fetching tracks for ${userId}:`, error);
    return [];
  }
}

/**
 * Check if the current user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    return false;
  }
}

/**
 * Get user's liked tracks
 */
export async function getUserLikes(
  userId: string | number,
  limit: number = 20
): Promise<any[]> {
  const cacheKey = `likes_${userId}_${limit}`;
  
  // Check cache first
  const cached = await CacheManager.getCachedData<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const likes = await makeAPIRequest<any[]>(`/users/${userId}/likes?limit=${limit}`);
    
    // Cache the result
    await CacheManager.setCachedData(cacheKey, likes);
    
    return likes;
  } catch (error) {
    console.error(`Error fetching likes for ${userId}:`, error);
    return [];
  }
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(
  userId: string | number,
  limit: number = 20
): Promise<any[]> {
  const cacheKey = `playlists_${userId}_${limit}`;
  
  // Check cache first
  const cached = await CacheManager.getCachedData<any[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const playlists = await makeAPIRequest<any[]>(`/users/${userId}/playlists?limit=${limit}`);
    
    // Cache the result
    await CacheManager.setCachedData(cacheKey, playlists);
    
    return playlists;
  } catch (error) {
    console.error(`Error fetching playlists for ${userId}:`, error);
    return [];
  }
} 