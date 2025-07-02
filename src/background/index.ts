/**
 * Background service worker for SoundSwitch extension
 * Chrome Manifest V3 compliant with proper lifecycle management
 */

import type { 
  MessageRequest, 
  MessageResponse, 
  SavedAccount
} from '../types';

import { 
  initializeStorage, 
  getStorageValue, 
  setStorageValue, 
  STORAGE_KEYS,
  CacheManager 
} from '../utils/storage';

import { 
  checkAuthentication, 
  getUserData, 
  getFollowerGrowth 
} from '../utils/api';

/**
 * Initialize extension on install or update
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.info('SoundSwitch installed/updated:', details.reason);
  
  // Initialize storage with defaults
  await initializeStorage();
  
  // Setup alarms for cache cleanup
  chrome.alarms.create('cleanupCache', { periodInMinutes: 30 });
  
  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

/**
 * Cookie management for account switching
 */
class AccountManager {
  /**
   * Get current account info from cookies and API
   */
  static async getCurrentAccountInfo(): Promise<SavedAccount | null> {
    try {
      // Get all relevant cookies
      const cookies = await chrome.cookies.getAll({
        domain: '.soundcloud.com'
      });
      
      // Find session-related cookies
      const sessionCookies = cookies.filter(cookie => 
        cookie.name === 'oauth_token' || 
        cookie.name.includes('session') ||
        cookie.name === 'sc_anonymous_id'
      );
      
      if (sessionCookies.length === 0) return null;
      
      // Try to get user info from API
      const userData = await getUserData('me');
      if (!userData) return null;
      
      return {
        id: userData.id,
        username: userData.username,
        displayName: userData.full_name || userData.username,
        avatarUrl: userData.avatar_url,
        cookies: sessionCookies.map(cookie => ({
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite as chrome.cookies.SameSiteStatus
        })),
        savedAt: Date.now()
      };
    } catch (error) {
      console.error('Error getting current account info:', error);
      return null;
    }
  }

  /**
   * Save current account to storage
   */
  static async saveCurrentAccount(): Promise<SavedAccount | null> {
    try {
      const accountInfo = await this.getCurrentAccountInfo();
      if (!accountInfo) return null;
      
      // Get existing accounts
      const accounts = await getStorageValue<Record<number, SavedAccount>>(STORAGE_KEYS.ACCOUNTS) || {};
      
      // Save account
      accounts[accountInfo.id] = accountInfo;
      
      await setStorageValue(STORAGE_KEYS.ACCOUNTS, accounts);
      await setStorageValue(STORAGE_KEYS.ACTIVE_ACCOUNT, accountInfo.id);
      
      return accountInfo;
    } catch (error) {
      console.error('Error saving account:', error);
      return null;
    }
  }

  /**
   * Switch to a different account
   */
  static async switchAccount(accountId: number): Promise<boolean> {
    try {
      // Get saved accounts
      const accounts = await getStorageValue<Record<number, SavedAccount>>(STORAGE_KEYS.ACCOUNTS) || {};
      
      const targetAccount = accounts[accountId];
      if (!targetAccount || !targetAccount.cookies) {
        console.error('Account not found or invalid:', accountId);
        return false;
      }
      
      // Clear current cookies
      const currentCookies = await chrome.cookies.getAll({
        domain: '.soundcloud.com'
      });
      
      for (const cookie of currentCookies) {
        if (cookie.name === 'oauth_token' || 
            cookie.name.includes('session') ||
            cookie.name === 'sc_anonymous_id') {
          await chrome.cookies.remove({
            url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path}`,
            name: cookie.name
          });
        }
      }
      
      // Set new cookies
      for (const cookie of targetAccount.cookies) {
        await chrome.cookies.set({
          url: `https://${cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain}${cookie.path}`,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite
        });
      }
      
      // Update active account
      await setStorageValue(STORAGE_KEYS.ACTIVE_ACCOUNT, accountId);
      
      // Clear cache as it may contain data from previous account
      await CacheManager.clearCache();
      
      return true;
    } catch (error) {
      console.error('Error switching account:', error);
      return false;
    }
  }

  /**
   * Remove an account from storage
   */
  static async removeAccount(accountId: number): Promise<boolean> {
    try {
      const accounts = await getStorageValue<Record<number, SavedAccount>>(STORAGE_KEYS.ACCOUNTS) || {};
      
      if (!accounts[accountId]) {
        return false;
      }
      
      delete accounts[accountId];
      await setStorageValue(STORAGE_KEYS.ACCOUNTS, accounts);
      
      // If removed account was active, clear active account
      const activeAccount = await getStorageValue<number>(STORAGE_KEYS.ACTIVE_ACCOUNT);
      if (activeAccount === accountId) {
        await setStorageValue(STORAGE_KEYS.ACTIVE_ACCOUNT, null);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing account:', error);
      return false;
    }
  }

  /**
   * Get all saved accounts
   */
  static async getSavedAccounts(): Promise<{
    accounts: Record<number, SavedAccount>;
    activeAccount: number | null;
  }> {
    try {
      const accounts = await getStorageValue<Record<number, SavedAccount>>(STORAGE_KEYS.ACCOUNTS) || {};
      const activeAccount = await getStorageValue<number>(STORAGE_KEYS.ACTIVE_ACCOUNT);
      
      return { accounts, activeAccount };
    } catch (error) {
      console.error('Error getting saved accounts:', error);
      return { accounts: {}, activeAccount: null };
    }
  }
}

/**
 * Message handler for communication with content scripts and popup
 */
async function handleMessage(
  request: MessageRequest,
  _sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  try {
    switch (request.action) {
      case 'checkAuth': {
        const authenticated = await checkAuthentication();
        return { authenticated };
      }
      
      case 'getUserData': {
        if (!request.userId) {
          return { error: 'userId is required', userData: null };
        }
        const userData = await getUserData(request.userId);
        return { userData };
      }
      
      case 'getFollowerGrowth': {
        if (!request.userId) {
          return { error: 'userId is required', growth: null };
        }
        const growth = await getFollowerGrowth(request.userId);
        return { growth };
      }
      
      case 'toggleViewMode': {
        const currentMode = await getStorageValue<'public' | 'user'>(STORAGE_KEYS.VIEW_MODE) || 'user';
        const newMode = currentMode === 'user' ? 'public' : 'user';
        await setStorageValue(STORAGE_KEYS.VIEW_MODE, newMode);
        return { newMode };
      }
      
      case 'toggleDarkMode': {
        const currentDarkMode = await getStorageValue<boolean>(STORAGE_KEYS.DARK_MODE) || false;
        const newDarkMode = !currentDarkMode;
        await setStorageValue(STORAGE_KEYS.DARK_MODE, newDarkMode);
        return { darkMode: newDarkMode };
      }
      
      case 'clearCache': {
        await CacheManager.clearCache();
        return { success: true };
      }
      
      case 'saveCurrentAccount': {
        const savedAccount = await AccountManager.saveCurrentAccount();
        return { success: !!savedAccount, account: savedAccount };
      }
      
      case 'getSavedAccounts': {
        const accountsData = await AccountManager.getSavedAccounts();
        return accountsData;
      }
      
      case 'switchAccount': {
        if (!request.accountId) {
          return { error: 'accountId is required', success: false };
        }
        const success = await AccountManager.switchAccount(request.accountId);
        return { success };
      }
      
      case 'removeAccount': {
        if (!request.accountId) {
          return { error: 'accountId is required', success: false };
        }
        const success = await AccountManager.removeAccount(request.accountId);
        return { success };
      }
      
      default:
        return { error: `Unknown action: ${request.action}` };
    }
  } catch (error) {
    console.error('Error handling message:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Listen for messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validate request
  if (!request || typeof request.action !== 'string') {
    sendResponse({ error: 'Invalid request' });
    return true;
  }
  
  // Handle message asynchronously
  handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Message handler error:', error);
      sendResponse({ error: 'Internal error' });
    });
  
  // Return true to indicate async response
  return true;
});

/**
 * Handle tab updates to inject content script if needed
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act on complete loading of SoundCloud pages
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('soundcloud.com')) {
    
    // Check if content script is already injected
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    } catch (error) {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['content.css']
        });
      } catch (injectError) {
        console.error('Failed to inject scripts:', injectError);
      }
    }
  }
});

/**
 * Clean up old cache entries periodically
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupCache') {
    await CacheManager.cleanupExpiredCache();
  }
});

/**
 * Handle extension icon click
 */
chrome.action.onClicked.addListener(async (tab) => {
  // If on SoundCloud, toggle view mode
  if (tab.url && tab.url.includes('soundcloud.com')) {
    const currentMode = await getStorageValue<'public' | 'user'>(STORAGE_KEYS.VIEW_MODE) || 'user';
    const newMode = currentMode === 'user' ? 'public' : 'user';
    await setStorageValue(STORAGE_KEYS.VIEW_MODE, newMode);
    
    // Notify content script
    chrome.tabs.sendMessage(tab.id!, { action: 'viewModeChanged', mode: newMode });
  }
});

// Export for testing
export { handleMessage, AccountManager }; 