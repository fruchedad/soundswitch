/**
 * Popup script for SoundSwitch extension
 * Handles popup UI interactions and settings management
 */

import type { SavedAccount } from '../types';

class PopupController {
  // DOM elements
  private elements = {
    publicViewBtn: null as HTMLButtonElement | null,
    userViewBtn: null as HTMLButtonElement | null,
    darkModeToggle: null as HTMLInputElement | null,
    autoHidePrivate: null as HTMLInputElement | null,
    showStats: null as HTMLInputElement | null,
    copyUrlBtn: null as HTMLButtonElement | null,
    clearCacheBtn: null as HTMLButtonElement | null,
    authStatus: null as HTMLElement | null,
    helpLink: null as HTMLAnchorElement | null,
    feedbackLink: null as HTMLAnchorElement | null,
    accountsList: null as HTMLElement | null,
    addAccountBtn: null as HTMLButtonElement | null,
  };

  // State
  private currentViewMode: 'public' | 'user' = 'user';
  private isAuthenticated = false;
  private savedAccounts: Record<number, SavedAccount> = {};
  private activeAccountId: number | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize popup
   */
  private async initialize(): Promise<void> {
    try {
      this.cacheElements();
      await this.loadAccounts();
      await this.loadSettings();
      await this.checkAuthentication();
      this.setupEventListeners();
      this.updateUI();
      this.updateAccountsList();
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  /**
   * Cache DOM element references
   */
  private cacheElements(): void {
    this.elements.publicViewBtn = document.getElementById('publicViewBtn') as HTMLButtonElement;
    this.elements.userViewBtn = document.getElementById('userViewBtn') as HTMLButtonElement;
    this.elements.darkModeToggle = document.getElementById('darkModeToggle') as HTMLInputElement;
    this.elements.autoHidePrivate = document.getElementById('autoHidePrivate') as HTMLInputElement;
    this.elements.showStats = document.getElementById('showStats') as HTMLInputElement;
    this.elements.copyUrlBtn = document.getElementById('copyUrlBtn') as HTMLButtonElement;
    this.elements.clearCacheBtn = document.getElementById('clearCacheBtn') as HTMLButtonElement;
    this.elements.authStatus = document.getElementById('authStatus');
    this.elements.helpLink = document.getElementById('helpLink') as HTMLAnchorElement;
    this.elements.feedbackLink = document.getElementById('feedbackLink') as HTMLAnchorElement;
    this.elements.accountsList = document.getElementById('accountsList');
    this.elements.addAccountBtn = document.getElementById('addAccountBtn') as HTMLButtonElement;
  }

  /**
   * Load saved accounts
   */
  private async loadAccounts(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getSavedAccounts' });
      this.savedAccounts = response.accounts || {};
      this.activeAccountId = response.activeAccount;
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const storage = await chrome.storage.local.get([
        'viewMode',
        'darkMode',
        'autoHidePrivate',
        'showStats'
      ]);

      this.currentViewMode = storage.viewMode || 'user';
      
      if (this.elements.darkModeToggle) {
        this.elements.darkModeToggle.checked = storage.darkMode || false;
      }
      
      if (this.elements.autoHidePrivate) {
        this.elements.autoHidePrivate.checked = storage.autoHidePrivate || false;
      }
      
      if (this.elements.showStats) {
        this.elements.showStats.checked = storage.showStats !== false;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Check authentication status
   */
  private async checkAuthentication(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      this.isAuthenticated = response.authenticated;
      this.updateAuthStatus();
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.isAuthenticated = false;
      this.updateAuthStatus();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // View mode buttons
    this.elements.publicViewBtn?.addEventListener('click', () => this.handleViewModeClick('public'));
    this.elements.userViewBtn?.addEventListener('click', () => this.handleViewModeClick('user'));

    // Settings toggles
    this.elements.darkModeToggle?.addEventListener('change', (e) => this.handleDarkModeToggle(e));
    this.elements.autoHidePrivate?.addEventListener('change', (e) => this.handleSettingToggle('autoHidePrivate', e));
    this.elements.showStats?.addEventListener('change', (e) => this.handleSettingToggle('showStats', e));

    // Action buttons
    this.elements.copyUrlBtn?.addEventListener('click', () => this.handleCopyUrl());
    this.elements.clearCacheBtn?.addEventListener('click', () => this.handleClearCache());
    this.elements.addAccountBtn?.addEventListener('click', () => this.handleAddAccount());

    // Footer links
    this.elements.helpLink?.addEventListener('click', (e) => this.handleHelpClick(e));
    this.elements.feedbackLink?.addEventListener('click', (e) => this.handleFeedbackClick(e));
  }

  /**
   * Update UI based on current state
   */
  private updateUI(): void {
    // Update view mode buttons
    this.elements.publicViewBtn?.classList.toggle('active', this.currentViewMode === 'public');
    this.elements.userViewBtn?.classList.toggle('active', this.currentViewMode === 'user');

    // Update action buttons based on auth status
    if (this.elements.addAccountBtn) {
      this.elements.addAccountBtn.disabled = !this.isAuthenticated;
      this.elements.addAccountBtn.title = this.isAuthenticated ? 
        'Save current account' : 'Log in to SoundCloud first';
    }
  }

  /**
   * Update authentication status display
   */
  private updateAuthStatus(): void {
    if (!this.elements.authStatus) return;

    const statusIcon = this.elements.authStatus.querySelector('.status-icon') as HTMLElement;
    const statusText = this.elements.authStatus.querySelector('.status-text') as HTMLElement;

    if (this.isAuthenticated) {
      this.elements.authStatus.classList.add('authenticated');
      if (statusIcon) statusIcon.textContent = '●';
      if (statusText) statusText.textContent = 'Authenticated';
    } else {
      this.elements.authStatus.classList.remove('authenticated');
      if (statusIcon) statusIcon.textContent = '●';
      if (statusText) statusText.textContent = 'Not authenticated';
    }
  }

  /**
   * Update accounts list display
   */
  private updateAccountsList(): void {
    if (!this.elements.accountsList) return;

    const accountIds = Object.keys(this.savedAccounts);
    
    if (accountIds.length === 0) {
      this.elements.accountsList.innerHTML = '<div class="empty-state">No saved accounts</div>';
      return;
    }

    this.elements.accountsList.innerHTML = accountIds.map(id => {
      const account = this.savedAccounts[Number(id)];
      const isActive = Number(id) === this.activeAccountId;
      
      return `
        <div class="account-item ${isActive ? 'active' : ''}" data-account-id="${id}">
          <div class="account-info">
            ${account.avatarUrl ? `<img src="${account.avatarUrl}" alt="${account.username}" class="account-avatar">` : ''}
            <div class="account-details">
              <div class="account-name">${account.displayName}</div>
              <div class="account-username">@${account.username}</div>
            </div>
          </div>
          <div class="account-actions">
            ${!isActive ? `<button class="switch-btn" data-action="switch" data-account-id="${id}">Switch</button>` : '<span class="active-label">Active</span>'}
            <button class="remove-btn" data-action="remove" data-account-id="${id}">×</button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to account actions
    this.elements.accountsList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAccountAction(e));
    });
  }

  /**
   * Handle view mode click
   */
  private async handleViewModeClick(mode: 'public' | 'user'): Promise<void> {
    if (mode === this.currentViewMode) return;

    try {
      await chrome.storage.local.set({ viewMode: mode });
      this.currentViewMode = mode;
      this.updateUI();

      // Notify content scripts
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'viewModeChanged', mode });
      }
    } catch (error) {
      console.error('Error changing view mode:', error);
    }
  }

  /**
   * Handle dark mode toggle
   */
  private async handleDarkModeToggle(event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const enabled = target.checked;

    try {
      await chrome.storage.local.set({ darkMode: enabled });
      
      // Notify background script
      await chrome.runtime.sendMessage({ action: 'toggleDarkMode', enabled });
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  }

  /**
   * Handle settings toggle
   */
  private async handleSettingToggle(setting: string, event: Event): Promise<void> {
    const target = event.target as HTMLInputElement;
    const value = target.checked;

    try {
      await chrome.storage.local.set({ [setting]: value });
    } catch (error) {
      console.error(`Error saving ${setting}:`, error);
    }
  }

  /**
   * Handle copy URL action
   */
  private async handleCopyUrl(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab?.url || !currentTab.url.includes('soundcloud.com')) {
        this.showNotification('Please navigate to a SoundCloud page first', 'error');
        return;
      }

      const url = new URL(currentTab.url);
      url.searchParams.delete('auth_token');
      url.searchParams.delete('secret_token');
      
      await navigator.clipboard.writeText(url.toString());
      this.showNotification('Public URL copied!');
    } catch (error) {
      console.error('Error copying URL:', error);
      this.showNotification('Failed to copy URL', 'error');
    }
  }

  /**
   * Handle clear cache action
   */
  private async handleClearCache(): Promise<void> {
    try {
      await chrome.runtime.sendMessage({ action: 'clearCache' });
      this.showNotification('Cache cleared!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.showNotification('Failed to clear cache', 'error');
    }
  }

  /**
   * Handle add account action
   */
  private async handleAddAccount(): Promise<void> {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'saveCurrentAccount' });
      
      if (response.success) {
        await this.loadAccounts();
        this.updateAccountsList();
        this.showNotification('Account saved!');
      } else {
        this.showNotification('Failed to save account', 'error');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      this.showNotification('Failed to save account', 'error');
    }
  }

  /**
   * Handle account action (switch/remove)
   */
  private async handleAccountAction(event: Event): Promise<void> {
    const button = event.target as HTMLButtonElement;
    const action = button.dataset.action;
    const accountId = button.dataset.accountId;

    if (!action || !accountId) return;

    try {
      if (action === 'switch') {
        const response = await chrome.runtime.sendMessage({
          action: 'switchAccount',
          accountId: Number(accountId)
        });

        if (response.success) {
          this.activeAccountId = Number(accountId);
          this.updateAccountsList();
          this.showNotification('Account switched!');
          
          // Reload active tab
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            chrome.tabs.reload(tabs[0].id);
          }
        }
      } else if (action === 'remove') {
        const response = await chrome.runtime.sendMessage({
          action: 'removeAccount',
          accountId: Number(accountId)
        });

        if (response.success) {
          await this.loadAccounts();
          this.updateAccountsList();
          this.showNotification('Account removed');
        }
      }
    } catch (error) {
      console.error(`Error ${action} account:`, error);
      this.showNotification(`Failed to ${action} account`, 'error');
    }
  }

  /**
   * Handle help link click
   */
  private handleHelpClick(event: Event): void {
    event.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/soundswitch/extension#readme'
    });
  }

  /**
   * Handle feedback link click
   */
  private handleFeedbackClick(event: Event): void {
    event.preventDefault();
    chrome.tabs.create({
      url: 'https://github.com/soundswitch/extension/issues'
    });
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `popup-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
}); 