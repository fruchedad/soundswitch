import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  APIError,
  getCurrentUser,
  getUserData,
  getFollowerGrowth,
  getUserTracks,
  checkAuthentication,
  getUserLikes,
  getUserPlaylists
} from '../../src/utils/api';
import { CacheManager } from '../../src/utils/storage';

// Mock fetch globally
global.fetch = vi.fn();

// Mock CacheManager
vi.mock('../../src/utils/storage', () => ({
  CacheManager: {
    getCachedData: vi.fn(),
    setCachedData: vi.fn(),
    clearCache: vi.fn()
  }
}));

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe('APIError', () => {
    it('should create an error with status code and response', () => {
      const error = new APIError('Test error', 404, { error: 'Not found' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.response).toEqual({ error: 'Not found' });
      expect(error.name).toBe('APIError');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user data', async () => {
      const mockUser = {
        id: 123,
        username: 'testuser',
        followers_count: 1000
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockUser
      });

      const result = await getCurrentUser();
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api-v2.soundcloud.com/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          }),
          credentials: 'include'
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null for 401 unauthorized', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized'
      });

      const result = await getCurrentUser();
      
      expect(result).toBeNull();
    });

    it('should throw error for other failures', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        text: async () => 'Internal Server Error'
      });

      await expect(getCurrentUser()).rejects.toThrow(APIError);
    });
  });

  describe('getUserData', () => {
    const mockUser = {
      id: 123,
      username: 'testuser',
      followers_count: 1000
    };

    it('should return cached data if available', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(mockUser);

      const result = await getUserData(123);
      
      expect(CacheManager.getCachedData).toHaveBeenCalledWith('user_123');
      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should fetch and cache data if not cached', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockUser
      });

      const result = await getUserData(123);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api-v2.soundcloud.com/users/123',
        expect.any(Object)
      );
      expect(CacheManager.setCachedData).toHaveBeenCalledWith('user_123', mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should return null on error', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await getUserData(123);
      
      expect(result).toBeNull();
    });
  });

  describe('getFollowerGrowth', () => {
    const mockUser = {
      id: 123,
      username: 'testuser',
      followers_count: 1000
    };

    it('should return cached growth data if available', async () => {
      const mockGrowth = {
        total: 1000,
        newThisWeek: 20,
        growthRate: 2.0
      };
      
      (CacheManager.getCachedData as any).mockResolvedValue(mockGrowth);

      const result = await getFollowerGrowth(123);
      
      expect(CacheManager.getCachedData).toHaveBeenCalledWith('growth_123');
      expect(result).toEqual(mockGrowth);
    });

    it('should calculate growth data from user data', async () => {
      (CacheManager.getCachedData as any)
        .mockResolvedValueOnce(null) // No cached growth
        .mockResolvedValueOnce(mockUser); // Cached user data

      const result = await getFollowerGrowth(123);
      
      expect(result).toEqual({
        total: 1000,
        newThisWeek: 20, // 2% of 1000
        growthRate: 2.0
      });
      expect(CacheManager.setCachedData).toHaveBeenCalledWith(
        'growth_123',
        expect.objectContaining({
          total: 1000,
          newThisWeek: 20,
          growthRate: 2.0
        })
      );
    });

    it('should return null if user has no followers', async () => {
      (CacheManager.getCachedData as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ ...mockUser, followers_count: undefined });

      const result = await getFollowerGrowth(123);
      
      expect(result).toBeNull();
    });
  });

  describe('getUserTracks', () => {
    const mockTracks = [
      { id: 1, title: 'Track 1' },
      { id: 2, title: 'Track 2' }
    ];

    it('should return cached tracks if available', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(mockTracks);

      const result = await getUserTracks(123);
      
      expect(CacheManager.getCachedData).toHaveBeenCalledWith('tracks_123_20');
      expect(result).toEqual(mockTracks);
    });

    it('should fetch and cache tracks', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockTracks
      });

      const result = await getUserTracks(123, 10);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api-v2.soundcloud.com/users/123/tracks?limit=10',
        expect.any(Object)
      );
      expect(CacheManager.setCachedData).toHaveBeenCalledWith('tracks_123_10', mockTracks);
      expect(result).toEqual(mockTracks);
    });

    it('should return empty array on error', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await getUserTracks(123);
      
      expect(result).toEqual([]);
    });
  });

  describe('checkAuthentication', () => {
    it('should return true if user is authenticated', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 123, username: 'testuser' })
      });

      const result = await checkAuthentication();
      
      expect(result).toBe(true);
    });

    it('should return false if user is not authenticated', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized'
      });

      const result = await checkAuthentication();
      
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await checkAuthentication();
      
      expect(result).toBe(false);
    });
  });

  describe('getUserLikes', () => {
    const mockLikes = [
      { id: 1, title: 'Liked Track 1' },
      { id: 2, title: 'Liked Track 2' }
    ];

    it('should fetch and cache user likes', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockLikes
      });

      const result = await getUserLikes(123, 15);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api-v2.soundcloud.com/users/123/likes?limit=15',
        expect.any(Object)
      );
      expect(CacheManager.setCachedData).toHaveBeenCalledWith('likes_123_15', mockLikes);
      expect(result).toEqual(mockLikes);
    });
  });

  describe('getUserPlaylists', () => {
    const mockPlaylists = [
      { id: 1, title: 'Playlist 1' },
      { id: 2, title: 'Playlist 2' }
    ];

    it('should fetch and cache user playlists', async () => {
      (CacheManager.getCachedData as any).mockResolvedValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPlaylists
      });

      const result = await getUserPlaylists(123);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api-v2.soundcloud.com/users/123/playlists?limit=20',
        expect.any(Object)
      );
      expect(CacheManager.setCachedData).toHaveBeenCalledWith('playlists_123_20', mockPlaylists);
      expect(result).toEqual(mockPlaylists);
    });
  });
}); 