/**
 * Background service worker for SoundSwitch extension
 * Handles authentication detection, API calls, and message passing
 * @see docs/manifest_mv3_what_is.md - Service worker implementation
 * @see docs/api_auth.md - SoundCloud authentication handling
 */

// Constants for API endpoints and storage keys
const SOUNDCLOUD_API_BASE = 'https://api-v2.soundcloud.com';
const STORAGE_KEYS = {
  VIEW_MODE: 'viewMode',
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  DARK_MODE: 'darkMode',
  STATS_CACHE: 'statsCache',
  ACCOUNTS: 'accounts',
  ACTIVE_ACCOUNT: 'activeAccount'
};

// Cache duration for API responses (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Initialize extension on install or update
 * @see docs/mdn_webextensions_api.md - chrome.runtime.onInstalled
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  // Set default values in storage
  await chrome.storage.local.set({
    [STORAGE_KEYS.VIEW_MODE]: 'user',
    [STORAGE_KEYS.DARK_MODE]: false,
    [STORAGE_KEYS.STATS_CACHE]: {},
    [STORAGE_KEYS.ACCOUNTS]: {},
    [STORAGE_KEYS.ACTIVE_ACCOUNT]: null
  });
  
  console.log('SoundSwitch installed/updated:', details.reason);
});

/**
 * Check if user is authenticated by examining cookies
 * @see docs/api_auth.md - Authentication detection
 * @return {Promise<boolean>} True if user is authenticated
 */
async function checkAuthentication() {
  try {
    // Check for SoundCloud session cookie
    const cookies = await chrome.cookies.getAll({
      domain: '.soundcloud.com'
    });
    
    // Look for oauth_token or session cookie
    const authCookie = cookies.find(cookie => 
      cookie.name === 'oauth_token' || 
      cookie.name === 'sc_anonymous_id' ||
      cookie.name.includes('session')
    );
    
    return !!authCookie;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Get current account info from cookies and API
 * @return {Promise<Object|null>} Account info or null
 */
async function getCurrentAccountInfo() {
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
    const response = await fetch(`${SOUNDCLOUD_API_BASE}/me`, {
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) return null;
    
    const userData = await response.json();
    
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
        sameSite: cookie.sameSite
      }))
    };
  } catch (error) {
    console.error('Error getting current account info:', error);
    return null;
  }
}

/**
 * Save current account to storage
 * @return {Promise<Object|null>} Saved account info or null
 */
async function saveCurrentAccount() {
  try {
    const accountInfo = await getCurrentAccountInfo();
    if (!accountInfo) return null;
    
    // Get existing accounts
    const storage = await chrome.storage.local.get([STORAGE_KEYS.ACCOUNTS]);
    const accounts = storage[STORAGE_KEYS.ACCOUNTS] || {};
    
    // Save account
    accounts[accountInfo.id] = {
      ...accountInfo,
      savedAt: Date.now()
    };
    
    await chrome.storage.local.set({
      [STORAGE_KEYS.ACCOUNTS]: accounts,
      [STORAGE_KEYS.ACTIVE_ACCOUNT]: accountInfo.id
    });
    
    return accountInfo;
  } catch (error) {
    console.error('Error saving account:', error);
    return null;
  }
}

/**
 * Switch to a different account
 * @param {string} accountId - Account ID to switch to
 * @return {Promise<boolean>} Success status
 */
async function switchAccount(accountId) {
  try {
    // Get saved accounts
    const storage = await chrome.storage.local.get([STORAGE_KEYS.ACCOUNTS]);
    const accounts = storage[STORAGE_KEYS.ACCOUNTS] || {};
    
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
    await chrome.storage.local.set({
      [STORAGE_KEYS.ACTIVE_ACCOUNT]: accountId
    });
    
    // Clear cache as it may contain data from previous account
    await chrome.storage.local.set({
      [STORAGE_KEYS.STATS_CACHE]: {}
    });
    
    return true;
  } catch (error) {
    console.error('Error switching account:', error);
    return false;
  }
}

/**
 * Remove a saved account
 * @param {string} accountId - Account ID to remove
 * @return {Promise<boolean>} Success status
 */
async function removeAccount(accountId) {
  try {
    const storage = await chrome.storage.local.get([STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.ACTIVE_ACCOUNT]);
    const accounts = storage[STORAGE_KEYS.ACCOUNTS] || {};
    
    delete accounts[accountId];
    
    // If removing active account, clear it
    const updates = {
      [STORAGE_KEYS.ACCOUNTS]: accounts
    };
    
    if (storage[STORAGE_KEYS.ACTIVE_ACCOUNT] === accountId) {
      updates[STORAGE_KEYS.ACTIVE_ACCOUNT] = null;
    }
    
    await chrome.storage.local.set(updates);
    return true;
  } catch (error) {
    console.error('Error removing account:', error);
    return false;
  }
}

/**
 * Get all saved accounts
 * @return {Promise<Object>} Map of account ID to account info
 */
async function getSavedAccounts() {
  try {
    const storage = await chrome.storage.local.get([STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.ACTIVE_ACCOUNT]);
    return {
      accounts: storage[STORAGE_KEYS.ACCOUNTS] || {},
      activeAccount: storage[STORAGE_KEYS.ACTIVE_ACCOUNT] || null
    };
  } catch (error) {
    console.error('Error getting saved accounts:', error);
    return { accounts: {}, activeAccount: null };
  }
}

/**
 * Fetch user data from SoundCloud API
 * @see docs/api_guide.md - Getting authenticated user info
 * @param {string} userId - User ID to fetch
 * @return {Promise<Object>} User data object
 */
async function fetchUserData(userId) {
  // Validate userId
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided:', userId);
    return null;
  }
  
  try {
    // Check cache first
    const cache = await chrome.storage.local.get(STORAGE_KEYS.STATS_CACHE);
    const statsCache = cache[STORAGE_KEYS.STATS_CACHE] || {};
    const cacheKey = `user_${userId}`;
    
    if (statsCache[cacheKey] && 
        Date.now() - statsCache[cacheKey].timestamp < CACHE_DURATION) {
      return statsCache[cacheKey].data;
    }
    
    // Fetch from API
    const response = await fetch(`${SOUNDCLOUD_API_BASE}/users/${userId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const userData = await response.json();
    
    // Update cache
    statsCache[cacheKey] = {
      data: userData,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({
      [STORAGE_KEYS.STATS_CACHE]: statsCache
    });
    
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Fetch follower growth stats
 * @see docs/api_guide.md - User followers endpoint
 * @param {string} userId - User ID
 * @return {Promise<Object>} Growth stats
 */
async function fetchFollowerGrowth(userId) {
  // Validate userId
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided:', userId);
    return null;
  }
  
  try {
    // Check cache
    const cache = await chrome.storage.local.get(STORAGE_KEYS.STATS_CACHE);
    const statsCache = cache[STORAGE_KEYS.STATS_CACHE] || {};
    const cacheKey = `growth_${userId}`;
    
    if (statsCache[cacheKey] && 
        Date.now() - statsCache[cacheKey].timestamp < CACHE_DURATION) {
      return statsCache[cacheKey].data;
    }
    
    // Fetch recent followers
    const response = await fetch(
      `${SOUNDCLOUD_API_BASE}/users/${userId}/followers?limit=200`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const followers = data.collection || [];
    
    // Calculate 7-day growth
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentFollowers = followers.filter(follower => {
      if (!follower.created_at) return false;
      const followDate = new Date(follower.created_at).getTime();
      return followDate > sevenDaysAgo;
    });
    
    // Calculate growth rate (avoid division by zero)
    const growthRate = followers.length > 0 
      ? ((recentFollowers.length / followers.length) * 100).toFixed(1)
      : '0.0';
    
    const growthData = {
      total: followers.length,
      last7Days: recentFollowers.length,
      growthRate: growthRate
    };
    
    // Update cache
    statsCache[cacheKey] = {
      data: growthData,
      timestamp: Date.now()
    };
    await chrome.storage.local.set({
      [STORAGE_KEYS.STATS_CACHE]: statsCache
    });
    
    return growthData;
  } catch (error) {
    console.error('Error fetching follower growth:', error);
    return null;
  }
}

/**
 * Handle messages from content script and popup
 * @see docs/mdn_webextensions_api.md - Message passing
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Validate request
  if (!request || typeof request.action !== 'string') {
    sendResponse({ error: 'Invalid request' });
    return true;
  }
  
  // Handle async responses
  (async () => {
    try {
      switch (request.action) {
        case 'checkAuth':
          const isAuthenticated = await checkAuthentication();
          sendResponse({ authenticated: isAuthenticated });
          break;
          
        case 'getUserData':
          if (!request.userId) {
            sendResponse({ error: 'userId is required', userData: null });
            break;
          }
          const userData = await fetchUserData(request.userId);
          sendResponse({ userData });
          break;
          
        case 'getFollowerGrowth':
          if (!request.userId) {
            sendResponse({ error: 'userId is required', growth: null });
            break;
          }
          const growth = await fetchFollowerGrowth(request.userId);
          sendResponse({ growth });
          break;
          
        case 'toggleViewMode':
          const storage = await chrome.storage.local.get(STORAGE_KEYS.VIEW_MODE);
          const currentMode = storage[STORAGE_KEYS.VIEW_MODE] || 'user';
          const newMode = currentMode === 'user' ? 'public' : 'user';
          await chrome.storage.local.set({
            [STORAGE_KEYS.VIEW_MODE]: newMode
          });
          sendResponse({ newMode });
          break;
          
        case 'toggleDarkMode':
          const darkModeStorage = await chrome.storage.local.get(STORAGE_KEYS.DARK_MODE);
          const currentDarkMode = darkModeStorage[STORAGE_KEYS.DARK_MODE] || false;
          const newDarkMode = !currentDarkMode;
          await chrome.storage.local.set({
            [STORAGE_KEYS.DARK_MODE]: newDarkMode
          });
          sendResponse({ darkMode: newDarkMode });
          break;
          
        case 'clearCache':
          await chrome.storage.local.set({
            [STORAGE_KEYS.STATS_CACHE]: {}
          });
          sendResponse({ success: true });
          break;
          
        case 'saveCurrentAccount':
          const savedAccount = await saveCurrentAccount();
          sendResponse({ success: !!savedAccount, account: savedAccount });
          break;
          
        case 'getSavedAccounts':
          const accountsData = await getSavedAccounts();
          sendResponse(accountsData);
          break;
          
        case 'switchAccount':
          if (!request.accountId) {
            sendResponse({ error: 'accountId is required', success: false });
            break;
          }
          const switchSuccess = await switchAccount(request.accountId);
          sendResponse({ success: switchSuccess });
          break;
          
        case 'removeAccount':
          if (!request.accountId) {
            sendResponse({ error: 'accountId is required', success: false });
            break;
          }
          const removeSuccess = await removeAccount(request.accountId);
          sendResponse({ success: removeSuccess });
          break;
          
        default:
          sendResponse({ error: 'Unknown action: ' + request.action });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();
  
  // Return true to indicate async response
  return true;
});

/**
 * Handle tab updates to inject content script if needed
 * @see docs/permissions_declare.md - activeTab permission usage
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act on complete loading of SoundCloud pages
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('soundcloud.com')) {
    
    // Check if we need to inject our content script
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
 * @see docs/webstore_best_practices.md - Performance optimization
 */
chrome.alarms.create('cleanupCache', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanupCache') {
    try {
      const storage = await chrome.storage.local.get(STORAGE_KEYS.STATS_CACHE);
      const statsCache = storage[STORAGE_KEYS.STATS_CACHE] || {};
      const now = Date.now();
      
      // Remove entries older than 1 hour
      const cleanedCache = {};
      for (const [key, value] of Object.entries(statsCache)) {
        if (value && value.timestamp && now - value.timestamp < 60 * 60 * 1000) {
          cleanedCache[key] = value;
        }
      }
      
      await chrome.storage.local.set({
        [STORAGE_KEYS.STATS_CACHE]: cleanedCache
      });
    } catch (error) {
      console.error('Error cleaning cache:', error);
    }
  }
}); 