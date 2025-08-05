/**
 * Content script for SoundSwitch extension
 * Handles DOM manipulation, view switching, and UI enhancements
 * Optimized with lazy loading and performance improvements
 */

import { DOMObserver } from './dom-observer';
import { ViewManager } from './view-manager';
import { UIEnhancements } from './ui-enhancements';

// Constants
const SELECTORS = {
  PROFILE_HEADER: 'header[class*="profileHeader"]',
  FOLLOWER_COUNT: '[class*="infoStats"] a[href*="/followers"]',
  FOLLOWING_COUNT: '[class*="infoStats"] a[href*="/following"]',
  TRACK_LIST: '[class*="userStream"] article',
  PRIVATE_TRACK: '[class*="private"], [class*="secretToken"]',
  LIKES_TAB: 'a[href*="/likes"]',
  REPOSTS_TAB: 'a[href*="/reposts"]',
  PLAYLISTS_TAB: 'a[href*="/sets"]',
  STATS_CONTAINER: '[class*="infoStats"]',
  PROFILE_TABS: '[class*="g-tabs"]',
  USER_NAME: 'h1[class*="profileHeaderInfo__userName"]',
  TRACK_ITEM: '.soundList__item',
  TRACK_STATS: '.soundStats',
  COMMENT_SECTION: '.commentsList',
  SIDEBAR: '.sidebarModule'
} as const;

class SoundSwitchContent {
  private currentViewMode: 'public' | 'user' = 'user';
  private darkModeEnabled = false;
  private isInitialized = false;
  private domObserver: DOMObserver;
  private viewManager: ViewManager | null = null; // Lazy loaded
  private uiEnhancements: UIEnhancements | null = null; // Lazy loaded
  private toggleButton: HTMLElement | null = null;
  
  // Performance optimizations
  private elementCache = new Map<string, Element | null>();
  private featureFlags = {
    hoverStats: false,
    quickShare: false,
    advancedFeatures: false
  };

  constructor() {
    this.domObserver = new DOMObserver();
  }

  /**
   * Initialize the extension with performance optimizations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Load critical settings first
      await this.loadCriticalSettings();

      // Check if we're on a profile page
      if (this.isProfilePage()) {
        // Initialize core features immediately
        await this.initializeCoreFeatures();
        
        // Defer non-critical features
        this.deferNonCriticalFeatures();
      }

      // Apply dark mode if enabled (critical for UX)
      if (this.darkModeEnabled) {
        this.applyDarkModeImmediate();
      }

      // Setup page change observation
      this.observePageChanges();

      // Setup message listener
      this.setupMessageListener();
    } catch (error) {
      console.error('Error initializing SoundSwitch:', error);
    }
  }

  /**
   * Load only critical settings for faster initialization
   */
  private async loadCriticalSettings(): Promise<void> {
    try {
      const storage = await chrome.storage.local.get(['viewMode', 'darkMode']);
      this.currentViewMode = storage.viewMode || 'user';
      this.darkModeEnabled = storage.darkMode || false;
    } catch (error) {
      console.error('Error loading critical settings:', error);
    }
  }

  /**
   * Initialize core features needed immediately
   */
  private async initializeCoreFeatures(): Promise<void> {
    // Create toggle button (critical for functionality)
    this.createToggleButton();
    
    // Apply current view mode
    await this.applyViewMode();
  }

  /**
   * Defer non-critical features to improve initial load time
   */
  private deferNonCriticalFeatures(): void {
    // Use requestIdleCallback for better performance
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.loadNonCriticalFeatures(), { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.loadNonCriticalFeatures(), 100);
    }
  }

  /**
   * Load non-critical features when browser is idle
   */
  private async loadNonCriticalFeatures(): Promise<void> {
    try {
      // Load additional settings
      const storage = await chrome.storage.local.get([
        'hoverStats', 'quickShare', 'advancedFeatures'
      ]);
      
      this.featureFlags = {
        hoverStats: storage.hoverStats !== false, // Default to true
        quickShare: storage.quickShare !== false, // Default to true
        advancedFeatures: storage.advancedFeatures || false
      };

      // Lazy load UI enhancements only when needed
      if (this.featureFlags.hoverStats || this.featureFlags.quickShare) {
        await this.loadUIEnhancements();
      }

      // Setup advanced features if enabled
      if (this.featureFlags.advancedFeatures) {
        this.setupAdvancedFeatures();
      }
    } catch (error) {
      console.error('Error loading non-critical features:', error);
    }
  }

  /**
   * Lazy load UI enhancements module
   */
  private async loadUIEnhancements(): Promise<void> {
    if (!this.uiEnhancements) {
      this.uiEnhancements = new UIEnhancements(SELECTORS);
      
      // Setup features based on flags
      if (this.featureFlags.hoverStats) {
        this.uiEnhancements.setupHoverStats();
      }
      
      if (this.featureFlags.quickShare) {
        this.uiEnhancements.setupQuickShare();
      }
    }
  }

  /**
   * Lazy load view manager when needed
   */
  private async loadViewManager(): Promise<ViewManager> {
    if (!this.viewManager) {
      this.viewManager = new ViewManager(SELECTORS);
    }
    return this.viewManager;
  }

  /**
   * Apply dark mode immediately without waiting for full initialization
   */
  private applyDarkModeImmediate(): void {
    // Add basic dark mode class immediately
    document.documentElement.classList.add('soundswitch-dark');
    
    // Defer full dark mode application
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.applyFullDarkMode());
    } else {
      setTimeout(() => this.applyFullDarkMode(), 50);
    }
  }

  /**
   * Apply full dark mode when system is idle
   */
  private async applyFullDarkMode(): Promise<void> {
    if (this.uiEnhancements) {
      this.uiEnhancements.applyDarkMode(true);
    } else {
      // Apply basic dark mode styles without loading full UI enhancements
      const style = document.createElement('style');
      style.textContent = `
        .soundswitch-dark {
          filter: invert(1) hue-rotate(180deg);
        }
        .soundswitch-dark img,
        .soundswitch-dark video,
        .soundswitch-dark iframe {
          filter: invert(1) hue-rotate(180deg);
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Optimized element caching to reduce DOM queries
   */
  private getCachedElement(selector: string): Element | null {
    if (!this.elementCache.has(selector)) {
      const element = document.querySelector(selector);
      this.elementCache.set(selector, element);
      
      // Clear cache after a delay to avoid stale references
      setTimeout(() => this.elementCache.delete(selector), 5000);
    }
    return this.elementCache.get(selector) || null;
  }

  /**
   * Check if current page is a user profile (optimized)
   */
  private isProfilePage(): boolean {
    const path = window.location.pathname;
    return path.split('/').length <= 3 && 
           !path.includes('/discover') && 
           !path.includes('/stream') && 
           !path.includes('/search');
  }

  /**
   * Create toggle button with optimized DOM operations
   */
  private createToggleButton(): void {
    if (this.toggleButton) return;

    const profileHeader = this.getCachedElement(SELECTORS.PROFILE_HEADER);
    if (!profileHeader) return;

    // Create button with optimized approach
    const fragment = document.createDocumentFragment();
    const button = document.createElement('button');
    button.className = 'soundswitch-toggle-btn';
    button.textContent = this.currentViewMode === 'public' ? '👁️ Public' : '🔒 User';
    button.title = `Switch to ${this.currentViewMode === 'public' ? 'user' : 'public'} view`;
    
    // Use event delegation for better performance
    button.addEventListener('click', this.handleToggleClick.bind(this), { passive: true });
    
    fragment.appendChild(button);
    profileHeader.appendChild(fragment);
    this.toggleButton = button;
  }

  /**
   * Handle toggle click with debouncing
   */
  private handleToggleClick = this.debounce(async () => {
    await this.toggleViewMode();
  }, 300);

  /**
   * Apply view mode with lazy loading
   */
  private async applyViewMode(): Promise<void> {
    try {
      const viewManager = await this.loadViewManager();
      await viewManager.applyViewMode(this.currentViewMode);
      this.updateToggleButton();
    } catch (error) {
      console.error('Error applying view mode:', error);
    }
  }

  /**
   * Toggle view mode with optimized state management
   */
  private async toggleViewMode(): Promise<void> {
    try {
      this.currentViewMode = this.currentViewMode === 'public' ? 'user' : 'public';
      
      // Save setting asynchronously
      chrome.storage.local.set({ viewMode: this.currentViewMode });
      
      // Apply view mode
      await this.applyViewMode();
      
      // Notify background script
      chrome.runtime.sendMessage({ action: 'viewModeChanged', mode: this.currentViewMode });
    } catch (error) {
      console.error('Error toggling view mode:', error);
    }
  }

  /**
   * Update toggle button appearance
   */
  private updateToggleButton(): void {
    if (!this.toggleButton) return;
    
    this.toggleButton.textContent = this.currentViewMode === 'public' ? '👁️ Public' : '🔒 User';
    this.toggleButton.title = `Switch to ${this.currentViewMode === 'public' ? 'user' : 'public'} view`;
  }

  /**
   * Setup advanced features when enabled
   */
  private setupAdvancedFeatures(): void {
    // Implement advanced features here
    console.log('Advanced features enabled');
  }

  /**
   * Observe page changes with optimization
   */
  private observePageChanges(): void {
    this.domObserver.observe(() => {
      // Clear element cache on page change
      this.elementCache.clear();
      
      // Re-initialize if on profile page
      if (this.isProfilePage()) {
        this.initializeCoreFeatures();
        this.deferNonCriticalFeatures();
      }
    });
  }

  /**
   * Setup message listener for background communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'toggleView') {
        this.toggleViewMode().then(() => sendResponse({ success: true }));
        return true; // Indicates async response
      }
      
      if (request.action === 'applyDarkMode') {
        this.darkModeEnabled = request.enabled;
        if (request.enabled) {
          this.applyDarkModeImmediate();
        } else {
          document.documentElement.classList.remove('soundswitch-dark');
        }
        sendResponse({ success: true });
      }
    });
  }

  /**
   * Utility function for debouncing
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Cleanup method for better memory management
   */
  cleanup(): void {
    this.domObserver.disconnect();
    this.elementCache.clear();
    this.toggleButton = null;
  }
}

// Initialize with performance monitoring
const soundSwitch = new SoundSwitchContent();

// Use the most efficient initialization method
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => soundSwitch.initialize(), { once: true });
} else {
  // Use microtask for immediate execution without blocking
  queueMicrotask(() => soundSwitch.initialize());
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => soundSwitch.cleanup(), { once: true }); 