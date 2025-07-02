/**
 * Content script for SoundSwitch extension
 * Handles DOM manipulation, view switching, and UI enhancements
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
  private viewManager: ViewManager;
  private uiEnhancements: UIEnhancements;
  private toggleButton: HTMLElement | null = null;

  constructor() {
    this.domObserver = new DOMObserver();
    this.viewManager = new ViewManager(SELECTORS);
    this.uiEnhancements = new UIEnhancements(SELECTORS);
  }

  /**
   * Initialize the extension
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // Load settings
      await this.loadSettings();

      // Check if we're on a profile page
      if (this.isProfilePage()) {
        this.createToggleButton();
        await this.applyViewMode();
        this.setupFeatures();
      }

      // Apply dark mode if enabled
      if (this.darkModeEnabled) {
        this.uiEnhancements.applyDarkMode(true);
      }

      // Observe page changes (SoundCloud is a SPA)
      this.observePageChanges();

      // Listen for messages from background
      this.setupMessageListener();
    } catch (error) {
      console.error('Error initializing SoundSwitch:', error);
    }
  }

  /**
   * Load saved settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const storage = await chrome.storage.local.get(['viewMode', 'darkMode']);
      this.currentViewMode = storage.viewMode || 'user';
      this.darkModeEnabled = storage.darkMode || false;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Check if current page is a user profile
   */
  private isProfilePage(): boolean {
    const path = window.location.pathname;
    return path.split('/').length <= 3 && 
           !path.includes('/discover') && 
           !path.includes('/stream') && 
           !path.includes('/search');
  }

  /**
   * Create floating toggle button
   */
  private createToggleButton(): void {
    if (this.toggleButton) {
      this.toggleButton.remove();
    }

    this.toggleButton = document.createElement('div');
    this.toggleButton.className = 'soundswitch-toggle';
    this.toggleButton.innerHTML = `
      <button class="soundswitch-toggle-btn" title="Toggle view mode">
        <span class="toggle-icon">${this.currentViewMode === 'public' ? '👀' : '🔒'}</span>
        <span class="toggle-text">${this.currentViewMode === 'public' ? 'Public' : 'User'} View</span>
      </button>
      <div class="soundswitch-menu">
        <button class="menu-item" data-action="copy-url">
          <span>📋</span> Copy Public URL
        </button>
        <button class="menu-item" data-action="toggle-private">
          <span>🔓</span> <span class="private-toggle-text">Show Private</span>
        </button>
        <button class="menu-item" data-action="dark-mode">
          <span>🌙</span> <span class="dark-mode-text">${this.darkModeEnabled ? 'Light' : 'Dark'} Mode</span>
        </button>
        <button class="menu-item" data-action="stats">
          <span>📊</span> Show Stats
        </button>
      </div>
    `;

    document.body.appendChild(this.toggleButton);
    this.setupToggleButtonListeners();
  }

  /**
   * Setup event listeners for toggle button
   */
  private setupToggleButtonListeners(): void {
    if (!this.toggleButton) return;

    const mainBtn = this.toggleButton.querySelector('.soundswitch-toggle-btn');
    if (mainBtn) {
      mainBtn.addEventListener('click', () => this.handleToggleClick());
    }

    // Menu items
    this.toggleButton.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleMenuClick(e as MouseEvent));
    });

    // Show/hide menu on hover
    this.toggleButton.addEventListener('mouseenter', () => {
      this.toggleButton?.classList.add('menu-open');
    });

    this.toggleButton.addEventListener('mouseleave', () => {
      this.toggleButton?.classList.remove('menu-open');
    });
  }

  /**
   * Handle toggle button click
   */
  private async handleToggleClick(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'toggleViewMode' });
      this.currentViewMode = response.newMode;
      this.updateToggleButton();
      await this.applyViewMode();
    } catch (error) {
      console.error('Error toggling view mode:', error);
    }
  }

  /**
   * Handle menu item clicks
   */
  private async handleMenuClick(event: MouseEvent): Promise<void> {
    const target = event.currentTarget as HTMLElement;
    const action = target.dataset.action;

    switch (action) {
      case 'copy-url':
        this.copyPublicUrl();
        break;
      case 'toggle-private':
        this.viewManager.togglePrivateTracks();
        break;
      case 'dark-mode':
        await this.toggleDarkMode();
        break;
      case 'stats':
        await this.uiEnhancements.showStatsModal();
        break;
    }
  }

  /**
   * Update toggle button appearance
   */
  private updateToggleButton(): void {
    if (!this.toggleButton) return;

    const icon = this.toggleButton.querySelector('.toggle-icon');
    const text = this.toggleButton.querySelector('.toggle-text');

    if (icon) icon.textContent = this.currentViewMode === 'public' ? '👀' : '🔒';
    if (text) text.textContent = `${this.currentViewMode === 'public' ? 'Public' : 'User'} View`;
  }

  /**
   * Apply the current view mode
   */
  private async applyViewMode(): Promise<void> {
    await this.viewManager.applyViewMode(this.currentViewMode);
  }

  /**
   * Setup additional features
   */
  private setupFeatures(): void {
    this.uiEnhancements.setupHoverStats();
    this.uiEnhancements.setupQuickShare();
    this.viewManager.setupPrivateTrackToggle();
  }

  /**
   * Copy public URL to clipboard
   */
  private copyPublicUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth_token');
    url.searchParams.delete('secret_token');
    
    navigator.clipboard.writeText(url.toString()).then(() => {
      this.showNotification('Public URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      this.showNotification('Failed to copy URL', 'error');
    });
  }

  /**
   * Toggle dark mode
   */
  private async toggleDarkMode(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'toggleDarkMode' });
      this.darkModeEnabled = response.darkMode;
      
      this.uiEnhancements.applyDarkMode(this.darkModeEnabled);
      
      // Update menu text
      const darkModeText = this.toggleButton?.querySelector('.dark-mode-text');
      if (darkModeText) {
        darkModeText.textContent = `${this.darkModeEnabled ? 'Light' : 'Dark'} Mode`;
      }
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `soundswitch-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Observe page changes for SPA navigation
   */
  private observePageChanges(): void {
    this.domObserver.observe(() => {
      const wasProfilePage = this.toggleButton !== null;
      const isNowProfilePage = this.isProfilePage();

      if (!wasProfilePage && isNowProfilePage) {
        // Navigated to a profile page
        this.createToggleButton();
        this.applyViewMode();
        this.setupFeatures();
      } else if (wasProfilePage && !isNowProfilePage) {
        // Navigated away from profile page
        this.toggleButton?.remove();
        this.toggleButton = null;
      }
    });
  }

  /**
   * Setup message listener for background script communication
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'ping') {
        sendResponse({ alive: true });
        return;
      }

      if (request.action === 'viewModeChanged' && request.mode) {
        this.currentViewMode = request.mode;
        this.updateToggleButton();
        this.applyViewMode();
      }
    });
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const soundSwitch = new SoundSwitchContent();
    soundSwitch.initialize();
  });
} else {
  const soundSwitch = new SoundSwitchContent();
  soundSwitch.initialize();
}

export { SoundSwitchContent }; 