import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViewManager } from '../../src/content/view-manager';

// Mock chrome runtime API
global.chrome = {
  runtime: {
    sendMessage: vi.fn()
  }
} as any;

describe('ViewManager', () => {
  let viewManager: ViewManager;
  let mockSelectors: Record<string, string>;
  let mockElements: Record<string, HTMLElement[]>;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    
    mockSelectors = {
      PRIVATE_TRACK: '.private-track',
      LIKES_TAB: '.likes-tab',
      REPOSTS_TAB: '.reposts-tab',
      COMMENT_SECTION: '.comments',
      FOLLOWING_COUNT: '.following-count',
      PROFILE_HEADER: '.profile-header',
      TRACK_ITEM: '.track-item'
    };

    // Create mock DOM elements
    mockElements = {
      privateTrack: [createMockElement('div', 'private-track')],
      likesTab: [createMockElement('a', 'likes-tab')],
      repostsTab: [createMockElement('a', 'reposts-tab')],
      comments: [createMockElement('div', 'comments')],
      followingCount: [createMockElement('span', 'following-count')],
      profileHeader: [createMockElement('header', 'profile-header')],
      trackItem: [createMockElement('div', 'track-item')]
    };

    // Add elements to DOM
    Object.values(mockElements).flat().forEach(el => document.body.appendChild(el));

    viewManager = new ViewManager(mockSelectors);
  });

  function createMockElement(tag: string, className: string): HTMLElement {
    const element = document.createElement(tag);
    element.className = className;
    return element;
  }

  describe('applyViewMode', () => {
    it('should apply public view mode', async () => {
      chrome.runtime.sendMessage = vi.fn().mockResolvedValue({ authenticated: true });

      await viewManager.applyViewMode('public');

      // Check that private elements are hidden
      expect(mockElements.privateTrack[0].style.display).toBe('none');
      expect(mockElements.likesTab[0].style.display).toBe('none');
      expect(mockElements.repostsTab[0].style.display).toBe('none');
      expect(mockElements.comments[0].style.display).toBe('none');
      
      // Check that view indicator is added
      const indicator = document.querySelector('.soundswitch-view-indicator');
      expect(indicator).toBeTruthy();
      expect(indicator?.textContent).toContain('Public visitor');
    });

    it('should hide following count in public view when not authenticated', async () => {
      chrome.runtime.sendMessage = vi.fn().mockResolvedValue({ authenticated: false });

      await viewManager.applyViewMode('public');

      expect(mockElements.followingCount[0].style.display).toBe('none');
    });

    it('should apply user view mode', async () => {
      // First apply public view to hide elements
      await viewManager.applyViewMode('public');
      
      // Then apply user view
      await viewManager.applyViewMode('user');

      // Check that all elements are visible
      expect(mockElements.privateTrack[0].style.display).toBe('');
      expect(mockElements.likesTab[0].style.display).toBe('');
      expect(mockElements.repostsTab[0].style.display).toBe('');
      expect(mockElements.comments[0].style.display).toBe('');
      
      // Check that view indicator is removed
      const indicator = document.querySelector('.soundswitch-view-indicator');
      expect(indicator).toBeFalsy();
    });
  });

  describe('setupPrivateTrackToggle', () => {
    beforeEach(() => {
      // Create a track item with private track inside
      const trackItem = document.createElement('div');
      trackItem.className = 'track-item';
      
      const privateTrack = document.createElement('div');
      privateTrack.className = 'private-track';
      
      trackItem.appendChild(privateTrack);
      document.body.appendChild(trackItem);
    });

    it('should add toggle links to private tracks', () => {
      viewManager.setupPrivateTrackToggle();

      const toggleLink = document.querySelector('.soundswitch-private-toggle');
      expect(toggleLink).toBeTruthy();
      expect(toggleLink?.textContent).toBe('🔓 Show Private Track');
    });

    it('should toggle private track visibility on click', () => {
      viewManager.setupPrivateTrackToggle();

      const toggleLink = document.querySelector('.soundswitch-private-toggle') as HTMLElement;
      const trackItem = document.querySelector('.track-item') as HTMLElement;
      
      // Initially visible (privateTracksVisible starts as true)
      expect(trackItem.classList.contains('soundswitch-private-hidden')).toBe(false);
      expect(toggleLink.textContent).toBe('🔓 Show Private Track');
      
      // Click to hide
      toggleLink.click();
      expect(trackItem.classList.contains('soundswitch-private-hidden')).toBe(true);
      expect(toggleLink.textContent).toBe('🔓 Show Private Track');
      
      // Click to show
      toggleLink.click();
      expect(trackItem.classList.contains('soundswitch-private-hidden')).toBe(false);
      expect(toggleLink.textContent).toBe('🔒 Hide Private Track');
    });
  });

  describe('togglePrivateTracks', () => {
    beforeEach(() => {
      // Create multiple track items with private tracks
      for (let i = 0; i < 3; i++) {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        
        const privateTrack = document.createElement('div');
        privateTrack.className = 'private-track';
        
        trackItem.appendChild(privateTrack);
        document.body.appendChild(trackItem);
      }
      
      viewManager.setupPrivateTrackToggle();
    });

    it('should toggle all private tracks at once', () => {
      const trackItems = document.querySelectorAll('.track-item');
      
      // Initially visible (privateTracksVisible starts as true)
      trackItems.forEach(item => {
        expect(item.classList.contains('soundswitch-private-hidden')).toBe(false);
      });
      
      // Toggle to hide all
      viewManager.togglePrivateTracks();
      trackItems.forEach(item => {
        expect(item.classList.contains('soundswitch-private-hidden')).toBe(true);
      });
      
      // Toggle to show all
      viewManager.togglePrivateTracks();
      trackItems.forEach(item => {
        expect(item.classList.contains('soundswitch-private-hidden')).toBe(false);
      });
    });
  });

  describe('DOM mutation handling', () => {
    it('should process new private tracks added to DOM', async () => {
      // We need to set up a proper track list first
      const trackList = document.createElement('div');
      trackList.className = 'track-list';
      document.body.appendChild(trackList);
      
      // Update selectors to include TRACK_LIST
      const extendedSelectors = {
        ...mockSelectors,
        TRACK_LIST: '.track-list'
      };
      
      const viewManagerWithTrackList = new ViewManager(extendedSelectors);
      viewManagerWithTrackList.setupPrivateTrackToggle();
      
      // Add a new track item dynamically
      const newTrackItem = document.createElement('div');
      newTrackItem.className = 'track-item';
      
      const newPrivateTrack = document.createElement('div');
      newPrivateTrack.className = 'private-track';
      
      newTrackItem.appendChild(newPrivateTrack);
      trackList.appendChild(newTrackItem);
      
      // Wait for mutation observer to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if toggle link was added to new track
      const toggleLink = newTrackItem.querySelector('.soundswitch-private-toggle');
      expect(toggleLink).toBeTruthy();
    });
  });
}); 