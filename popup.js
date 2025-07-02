/**
 * Popup script for SoundSwitch extension
 * Handles popup UI interactions and settings management
 * @see docs/google_js_style_guide.md - JavaScript best practices
 * @see docs/mdn_webextensions_api.md - Extension APIs
 */

// DOM elements
const elements = {
  publicViewBtn: null,
  userViewBtn: null,
  darkModeToggle: null,
  autoHidePrivate: null,
  showStats: null,
  copyUrlBtn: null,
  clearCacheBtn: null,
  authStatus: null,
  helpLink: null,
  feedbackLink: null,
  accountsList: null,
  addAccountBtn: null
};

// Current state
let currentViewMode = 'user';
let isAuthenticated = false;
let savedAccounts = {};
let activeAccountId = null;

/**
 * Initialize popup when DOM is loaded
 * @see docs/mdn_webextensions_overview.md - Popup scripts
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Cache DOM elements
    cacheElements();
    
    // Load saved accounts
    await loadAccounts();
    
    // Load current settings
    await loadSettings();
    
    // Check authentication
    await checkAuthentication();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updateUI();
    updateAccountsList();
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});

/**
 * Cache DOM elements for performance
 */
function cacheElements() {
  elements.publicViewBtn = document.getElementById('publicViewBtn');
  elements.userViewBtn = document.getElementById('userViewBtn');
  elements.darkModeToggle = document.getElementById('darkModeToggle');
  elements.autoHidePrivate = document.getElementById('autoHidePrivate');
  elements.showStats = document.getElementById('showStats');
  elements.copyUrlBtn = document.getElementById('copyUrlBtn');
  elements.clearCacheBtn = document.getElementById('clearCacheBtn');
  elements.authStatus = document.getElementById('authStatus');
  elements.helpLink = document.getElementById('helpLink');
  elements.feedbackLink = document.getElementById('feedbackLink');
  elements.accountsList = document.getElementById('accountsList');
  elements.addAccountBtn = document.getElementById('addAccountBtn');
  
  // Verify critical elements exist
  if (!elements.authStatus) {
    console.error('Critical DOM elements missing');
  }
}

/**
 * Load saved accounts from storage
 */
async function loadAccounts() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSavedAccounts' });
    savedAccounts = response.accounts || {};
    activeAccountId = response.activeAccount || null;
  } catch (error) {
    console.error('Error loading accounts:', error);
    savedAccounts = {};
    activeAccountId = null;
  }
}

/**
 * Load settings from storage
 * @see docs/mdn_webextensions_api.md - chrome.storage API
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get([
      'viewMode',
      'darkMode',
      'autoHidePrivate',
      'showStats'
    ]);
    
    currentViewMode = settings.viewMode || 'user';
    
    if (elements.darkModeToggle) {
      elements.darkModeToggle.checked = settings.darkMode || false;
    }
    if (elements.autoHidePrivate) {
      elements.autoHidePrivate.checked = settings.autoHidePrivate !== false;
    }
    if (elements.showStats) {
      elements.showStats.checked = settings.showStats !== false;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Check authentication status
 */
async function checkAuthentication() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
    isAuthenticated = response.authenticated;
    updateAuthStatus();
  } catch (error) {
    console.error('Error checking authentication:', error);
    updateAuthStatus(false, 'Error checking status');
  }
}

/**
 * Update authentication status display
 * @param {boolean} authenticated - Authentication status
 * @param {string} message - Optional custom message
 */
function updateAuthStatus(authenticated = isAuthenticated, message = null) {
  if (!elements.authStatus) return;
  
  const statusText = elements.authStatus.querySelector('.status-text');
  if (!statusText) return;
  
  if (message) {
    statusText.textContent = message;
    elements.authStatus.className = 'status-item error';
  } else if (authenticated) {
    statusText.textContent = 'Authenticated with SoundCloud';
    elements.authStatus.className = 'status-item authenticated';
  } else {
    statusText.textContent = 'Not authenticated';
    elements.authStatus.className = 'status-item';
  }
}

/**
 * Update accounts list UI
 */
function updateAccountsList() {
  if (!elements.accountsList) return;
  
  elements.accountsList.innerHTML = '';
  
  // Add each saved account
  Object.entries(savedAccounts).forEach(([accountId, account]) => {
    const accountItem = document.createElement('div');
    accountItem.className = 'account-item';
    if (accountId === activeAccountId) {
      accountItem.classList.add('active');
    }
    
    accountItem.innerHTML = `
      <img class="account-avatar" src="${account.avatarUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e0e0e0"/><circle cx="50" cy="40" r="15" fill="%23999"/><path d="M 30 70 Q 50 55 70 70" fill="%23999"/></svg>'}" alt="${account.displayName}">
      <div class="account-info">
        <div class="account-name">${account.displayName}</div>
        <div class="account-username">@${account.username}</div>
      </div>
      <div class="account-actions">
        ${accountId === activeAccountId ? '<span title="Active">✓</span>' : ''}
        <button class="account-action-btn" data-action="remove" data-account-id="${accountId}" title="Remove account">🗑️</button>
      </div>
    `;
    
    // Add click handler for switching accounts
    accountItem.addEventListener('click', (e) => {
      // Don't switch if clicking on remove button
      if (e.target.closest('[data-action="remove"]')) return;
      handleAccountSwitch(accountId);
    });
    
    // Add remove button handler
    const removeBtn = accountItem.querySelector('[data-action="remove"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleAccountRemove(accountId);
      });
    }
    
    elements.accountsList.appendChild(accountItem);
  });
  
  // Show message if no accounts saved
  if (Object.keys(savedAccounts).length === 0) {
    elements.accountsList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No saved accounts</div>';
  }
}

/**
 * Handle account switching
 * @param {string} accountId - Account ID to switch to
 */
async function handleAccountSwitch(accountId) {
  if (accountId === activeAccountId) return;
  
  try {
    // Show loading state
    showNotification('Switching account...');
    
    const response = await chrome.runtime.sendMessage({
      action: 'switchAccount',
      accountId: accountId
    });
    
    if (response.success) {
      activeAccountId = accountId;
      updateAccountsList();
      
      // Reload the current tab to apply the new session
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.url?.includes('soundcloud.com')) {
        chrome.tabs.reload(tabs[0].id);
      }
      
      showNotification('✅ Account switched successfully!');
      
      // Close popup after short delay
      setTimeout(() => window.close(), 1500);
    } else {
      showNotification('❌ Failed to switch account');
    }
  } catch (error) {
    console.error('Error switching account:', error);
    showNotification('❌ Error switching account');
  }
}

/**
 * Handle account removal
 * @param {string} accountId - Account ID to remove
 */
async function handleAccountRemove(accountId) {
  if (!confirm('Remove this saved account?')) return;
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'removeAccount',
      accountId: accountId
    });
    
    if (response.success) {
      delete savedAccounts[accountId];
      if (accountId === activeAccountId) {
        activeAccountId = null;
      }
      updateAccountsList();
      showNotification('✅ Account removed');
    } else {
      showNotification('❌ Failed to remove account');
    }
  } catch (error) {
    console.error('Error removing account:', error);
    showNotification('❌ Error removing account');
  }
}

/**
 * Handle saving current account
 */
async function handleSaveAccount() {
  if (!isAuthenticated) {
    showNotification('Please log in to SoundCloud first');
    return;
  }
  
  try {
    showNotification('Saving account...');
    
    const response = await chrome.runtime.sendMessage({
      action: 'saveCurrentAccount'
    });
    
    if (response.success && response.account) {
      savedAccounts[response.account.id] = response.account;
      activeAccountId = response.account.id;
      updateAccountsList();
      showNotification('✅ Account saved successfully!');
    } else {
      showNotification('❌ Failed to save account');
    }
  } catch (error) {
    console.error('Error saving account:', error);
    showNotification('❌ Error saving account');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // View mode buttons
  if (elements.publicViewBtn) {
    elements.publicViewBtn.addEventListener('click', () => handleViewModeChange('public'));
  }
  if (elements.userViewBtn) {
    elements.userViewBtn.addEventListener('click', () => handleViewModeChange('user'));
  }
  
  // Feature toggles
  if (elements.darkModeToggle) {
    elements.darkModeToggle.addEventListener('change', handleDarkModeToggle);
  }
  if (elements.autoHidePrivate) {
    elements.autoHidePrivate.addEventListener('change', handleAutoHideToggle);
  }
  if (elements.showStats) {
    elements.showStats.addEventListener('change', handleShowStatsToggle);
  }
  
  // Action buttons
  if (elements.copyUrlBtn) {
    elements.copyUrlBtn.addEventListener('click', handleCopyUrl);
  }
  if (elements.clearCacheBtn) {
    elements.clearCacheBtn.addEventListener('click', handleClearCache);
  }
  if (elements.addAccountBtn) {
    elements.addAccountBtn.addEventListener('click', handleSaveAccount);
  }
  
  // Footer links
  if (elements.helpLink) {
    elements.helpLink.addEventListener('click', handleHelpClick);
  }
  if (elements.feedbackLink) {
    elements.feedbackLink.addEventListener('click', handleFeedbackClick);
  }
}

/**
 * Handle view mode change
 * @param {string} mode - New view mode
 */
async function handleViewModeChange(mode) {
  if (mode === currentViewMode) return;
  
  try {
    currentViewMode = mode;
    await chrome.storage.local.set({ viewMode: mode });
    
    // Notify content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url?.includes('soundcloud.com')) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'viewModeChanged', 
          mode: mode 
        });
      } catch (error) {
        console.error('Error sending message to content script:', error);
        // Content script might not be loaded on this page
      }
    }
    
    updateUI();
  } catch (error) {
    console.error('Error changing view mode:', error);
  }
}

/**
 * Handle dark mode toggle
 */
async function handleDarkModeToggle(event) {
  try {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ darkMode: enabled });
    
    // Notify background script
    await chrome.runtime.sendMessage({ 
      action: 'toggleDarkMode',
      enabled: enabled
    });
  } catch (error) {
    console.error('Error toggling dark mode:', error);
  }
}

/**
 * Handle auto-hide private tracks toggle
 */
async function handleAutoHideToggle(event) {
  try {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ autoHidePrivate: enabled });
  } catch (error) {
    console.error('Error toggling auto-hide:', error);
  }
}

/**
 * Handle show stats toggle
 */
async function handleShowStatsToggle(event) {
  try {
    const enabled = event.target.checked;
    await chrome.storage.local.set({ showStats: enabled });
  } catch (error) {
    console.error('Error toggling stats:', error);
  }
}

/**
 * Handle copy URL action
 */
async function handleCopyUrl() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    if (!currentTab?.url?.includes('soundcloud.com')) {
      showNotification('Please visit a SoundCloud profile first');
      return;
    }
    
    const url = currentTab.url.split('?')[0]; // Remove query params
    await navigator.clipboard.writeText(url);
    
    // Update button text temporarily
    if (elements.copyUrlBtn) {
      const originalText = elements.copyUrlBtn.innerHTML;
      elements.copyUrlBtn.innerHTML = '<span>✅</span> Copied!';
      setTimeout(() => {
        if (elements.copyUrlBtn) {
          elements.copyUrlBtn.innerHTML = originalText;
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error copying URL:', error);
    showNotification('Failed to copy URL');
  }
}

/**
 * Handle clear cache action
 */
async function handleClearCache() {
  try {
    await chrome.runtime.sendMessage({ action: 'clearCache' });
    
    // Update button text temporarily
    if (elements.clearCacheBtn) {
      const originalText = elements.clearCacheBtn.innerHTML;
      elements.clearCacheBtn.innerHTML = '<span>✅</span> Cleared!';
      setTimeout(() => {
        if (elements.clearCacheBtn) {
          elements.clearCacheBtn.innerHTML = originalText;
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    showNotification('Failed to clear cache');
  }
}

/**
 * Handle help link click
 */
function handleHelpClick(event) {
  event.preventDefault();
  chrome.tabs.create({ 
    url: 'https://github.com/yourusername/soundswitch/wiki' 
  });
}

/**
 * Handle feedback link click
 */
function handleFeedbackClick(event) {
  event.preventDefault();
  chrome.tabs.create({ 
    url: 'https://github.com/yourusername/soundswitch/issues' 
  });
}

/**
 * Update UI based on current state
 */
function updateUI() {
  // Update view mode buttons
  if (elements.publicViewBtn) {
    elements.publicViewBtn.classList.toggle('active', currentViewMode === 'public');
  }
  if (elements.userViewBtn) {
    elements.userViewBtn.classList.toggle('active', currentViewMode === 'user');
  }
}

/**
 * Show temporary notification
 * @param {string} message - Notification message
 */
function showNotification(message) {
  // Remove existing notification
  const existing = document.querySelector('.popup-notification');
  if (existing) existing.remove();
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'popup-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
} 