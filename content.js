/**
 * Content script for SoundSwitch extension
 * Handles DOM manipulation, view switching, and UI enhancements
 * @see docs/mdn_webextensions_overview.md - Content script implementation
 * @see docs/account_privacy.md - Privacy settings understanding
 */

// State management
let currentViewMode = 'user';
let isAuthenticated = false;
let toggleButton = null;
let darkModeEnabled = false;
let isInitialized = false;

// Selectors for SoundCloud elements (may need updates as SC changes)
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
};

/**
 * Initialize the extension functionality
 * @see docs/google_js_style_guide.md - Code organization
 */
async function initialize() {
  // Prevent double initialization
  if (isInitialized) return;
  isInitialized = true;
  
  try {
    // Load saved settings
    const storage = await chrome.storage.local.get(['viewMode', 'darkMode']);
    currentViewMode = storage.viewMode || 'user';
    darkModeEnabled = storage.darkMode || false;
    
    // Check authentication status
    const authResponse = await chrome.runtime.sendMessage({ action: 'checkAuth' });
    isAuthenticated = authResponse.authenticated;
    
    // Only show toggle on profile pages
    if (isProfilePage()) {
      createToggleButton();
      applyViewMode();
      setupFeatures();
    }
    
    // Apply dark mode if enabled
    if (darkModeEnabled) {
      applyDarkMode(true);
    }
    
    // Listen for navigation changes (SoundCloud is a SPA)
    observePageChanges();
  } catch (error) {
    console.error('Error initializing SoundSwitch:', error);
  }
}

/**
 * Check if current page is a user profile
 * @return {boolean} True if on profile page
 */
function isProfilePage() {
  const path = window.location.pathname;
  // Profile URLs are like /username or /username/tracks
  return path.split('/').length <= 3 && !path.includes('/discover') && 
         !path.includes('/stream') && !path.includes('/search');
}

/**
 * Create floating toggle button
 * @see docs/webstore_best_practices.md - UI best practices
 */
function createToggleButton() {
  // Remove existing button if any
  if (toggleButton) {
    toggleButton.remove();
  }
  
  // Create button container
  toggleButton = document.createElement('div');
  toggleButton.className = 'soundswitch-toggle';
  toggleButton.innerHTML = `
    <button class="soundswitch-toggle-btn" title="Toggle view mode">
      <span class="toggle-icon">${currentViewMode === 'public' ? '👀' : '🔒'}</span>
      <span class="toggle-text">${currentViewMode === 'public' ? 'Public' : 'User'} View</span>
    </button>
    <div class="soundswitch-menu">
      <button class="menu-item" data-action="copy-url">
        <span>📋</span> Copy Public URL
      </button>
      <button class="menu-item" data-action="toggle-private">
        <span>🔓</span> <span class="private-toggle-text">Show Private</span>
      </button>
      <button class="menu-item" data-action="dark-mode">
        <span>🌙</span> <span class="dark-mode-text">${darkModeEnabled ? 'Light' : 'Dark'} Mode</span>
      </button>
    </div>
  `;
  
  document.body.appendChild(toggleButton);
  
  // Add event listeners
  const mainBtn = toggleButton.querySelector('.soundswitch-toggle-btn');
  if (mainBtn) {
    mainBtn.addEventListener('click', handleToggleClick);
  }
  
  // Menu items
  toggleButton.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', handleMenuClick);
  });
  
  // Show/hide menu on hover
  toggleButton.addEventListener('mouseenter', () => {
    toggleButton.classList.add('menu-open');
  });
  
  toggleButton.addEventListener('mouseleave', () => {
    toggleButton.classList.remove('menu-open');
  });
}

/**
 * Handle toggle button click
 * @see docs/mdn_webextensions_api.md - Message passing
 */
async function handleToggleClick() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'toggleViewMode' });
    currentViewMode = response.newMode;
    updateToggleButton();
    applyViewMode();
  } catch (error) {
    console.error('Error toggling view mode:', error);
  }
}

/**
 * Handle menu item clicks
 * @param {Event} event - Click event
 */
async function handleMenuClick(event) {
  const action = event.currentTarget.dataset.action;
  
  switch (action) {
    case 'copy-url':
      copyPublicUrl();
      break;
    case 'toggle-private':
      togglePrivateTracks();
      break;
    case 'dark-mode':
      await toggleDarkMode();
      break;
  }
}

/**
 * Update toggle button appearance
 */
function updateToggleButton() {
  if (!toggleButton) return;
  
  const icon = toggleButton.querySelector('.toggle-icon');
  const text = toggleButton.querySelector('.toggle-text');
  
  if (icon) icon.textContent = currentViewMode === 'public' ? '👀' : '🔒';
  if (text) text.textContent = `${currentViewMode === 'public' ? 'Public' : 'User'} View`;
}

/**
 * Apply the current view mode to the page
 * @see docs/account_privacy.md - Privacy elements to hide/show
 */
function applyViewMode() {
  if (currentViewMode === 'public') {
    applyPublicView();
  } else {
    applyUserView();
  }
}

/**
 * Apply public view - hide private elements
 * @see docs/manage_privacy.md - Elements hidden in private mode
 */
function applyPublicView() {
  // Hide follower/following counts
  document.querySelectorAll(SELECTORS.FOLLOWER_COUNT).forEach(el => {
    el.style.display = 'none';
  });
  document.querySelectorAll(SELECTORS.FOLLOWING_COUNT).forEach(el => {
    el.style.display = 'none';
  });
  
  // Hide likes, reposts, playlists tabs
  hideElement(SELECTORS.LIKES_TAB);
  hideElement(SELECTORS.REPOSTS_TAB);
  hideElement(SELECTORS.PLAYLISTS_TAB);
  
  // Hide private tracks
  document.querySelectorAll(SELECTORS.PRIVATE_TRACK).forEach(track => {
    const container = track.closest(SELECTORS.TRACK_ITEM) || track;
    container.style.display = 'none';
  });
  
  // Hide comments on tracks
  hideElement(SELECTORS.COMMENT_SECTION);
  
  // Hide detailed stats
  document.querySelectorAll(SELECTORS.TRACK_STATS).forEach(stats => {
    stats.style.opacity = '0.5';
    stats.style.pointerEvents = 'none';
  });
  
  // Add public view indicator
  addViewIndicator('public');
}

/**
 * Apply user view - show all elements
 */
function applyUserView() {
  // Show all hidden elements
  document.querySelectorAll('[style*="display: none"]').forEach(el => {
    if (el.classList.contains('soundswitch-hidden')) {
      el.style.display = '';
    }
  });
  
  // Restore stats
  document.querySelectorAll(SELECTORS.TRACK_STATS).forEach(stats => {
    stats.style.opacity = '';
    stats.style.pointerEvents = '';
  });
  
  // Remove public view indicator
  removeViewIndicator();
}

/**
 * Helper to hide elements
 * @param {string} selector - CSS selector
 */
function hideElement(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.classList.add('soundswitch-hidden');
    el.style.display = 'none';
  });
}

/**
 * Add view mode indicator to profile
 * @param {string} mode - Current view mode
 */
function addViewIndicator(mode) {
  removeViewIndicator();
  
  const header = document.querySelector(SELECTORS.PROFILE_HEADER);
  if (header) {
    const indicator = document.createElement('div');
    indicator.className = 'soundswitch-indicator';
    indicator.innerHTML = `
      <span class="indicator-icon">👀</span>
      <span>Viewing as: <strong>${mode === 'public' ? 'Public Visitor' : 'Authenticated User'}</strong></span>
    `;
    header.appendChild(indicator);
  }
}

/**
 * Remove view mode indicator
 */
function removeViewIndicator() {
  const indicator = document.querySelector('.soundswitch-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Set up additional features
 * @see docs/webstore_best_practices.md - Feature implementation
 */
function setupFeatures() {
  // Auto-hide private tracks feature
  setupPrivateTrackToggle();
  
  // Hover stats feature
  setupHoverStats();
  
  // Quick share button
  setupQuickShare();
}

/**
 * Set up private track toggle functionality
 */
function setupPrivateTrackToggle() {
  const privateTracks = document.querySelectorAll(SELECTORS.PRIVATE_TRACK);
  
  privateTracks.forEach(track => {
    const container = track.closest(SELECTORS.TRACK_ITEM) || track;
    
    // Skip if already processed
    if (container.querySelector('.soundswitch-private-toggle')) return;
    
    // Add collapse class
    container.classList.add('soundswitch-private-collapsed');
    
    // Add toggle link
    const toggleLink = document.createElement('a');
    toggleLink.className = 'soundswitch-private-toggle';
    toggleLink.href = '#';
    toggleLink.innerHTML = '🔓 Show Private Track';
    
    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      container.classList.toggle('soundswitch-private-collapsed');
      toggleLink.innerHTML = container.classList.contains('soundswitch-private-collapsed') 
        ? '🔓 Show Private Track' 
        : '🔒 Hide Private Track';
    });
    
    container.insertBefore(toggleLink, container.firstChild);
  });
}

/**
 * Toggle all private tracks visibility
 */
function togglePrivateTracks() {
  const collapsed = document.querySelector('.soundswitch-private-collapsed');
  const showAll = !!collapsed;
  
  document.querySelectorAll('.soundswitch-private-toggle').forEach(toggle => {
    const container = toggle.parentElement;
    if (!container) return;
    
    if (showAll) {
      container.classList.remove('soundswitch-private-collapsed');
      toggle.innerHTML = '🔒 Hide Private Track';
    } else {
      container.classList.add('soundswitch-private-collapsed');
      toggle.innerHTML = '🔓 Show Private Track';
    }
  });
  
  // Update menu text
  const menuItem = document.querySelector('[data-action="toggle-private"] .private-toggle-text');
  if (menuItem) {
    menuItem.textContent = showAll ? 'Hide Private' : 'Show Private';
  }
}

/**
 * Set up hover stats for follower counts
 * @see docs/api_guide.md - Follower growth API usage
 */
function setupHoverStats() {
  const followerLinks = document.querySelectorAll(SELECTORS.FOLLOWER_COUNT);
  
  followerLinks.forEach(link => {
    let tooltip = null;
    let isHovering = false;
    
    link.addEventListener('mouseenter', async () => {
      isHovering = true;
      
      // Extract user ID from URL
      const userId = extractUserIdFromUrl();
      if (!userId) return;
      
      // Create tooltip
      tooltip = document.createElement('div');
      tooltip.className = 'soundswitch-tooltip';
      tooltip.innerHTML = '<span class="loading">Loading stats...</span>';
      document.body.appendChild(tooltip);
      
      // Position tooltip
      const rect = link.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom + 5}px`;
      
      try {
        // Fetch growth data
        const response = await chrome.runtime.sendMessage({
          action: 'getFollowerGrowth',
          userId: userId
        });
        
        // Check if still hovering
        if (!isHovering || !tooltip) return;
        
        if (response && response.growth) {
          tooltip.innerHTML = `
            <div class="stat-row">
              <span>Last 7 days:</span>
              <strong>+${response.growth.last7Days} followers</strong>
            </div>
            <div class="stat-row">
              <span>Growth rate:</span>
              <strong>${response.growth.growthRate}%</strong>
            </div>
          `;
        } else {
          tooltip.innerHTML = '<span class="error">⚠️ Could not load stats</span>';
        }
      } catch (error) {
        console.error('Error fetching follower stats:', error);
        if (tooltip) {
          tooltip.innerHTML = '<span class="error">⚠️ Error loading stats</span>';
        }
      }
    });
    
    link.addEventListener('mouseleave', () => {
      isHovering = false;
      if (tooltip) {
        tooltip.remove();
        tooltip = null;
      }
    });
  });
}

/**
 * Extract user ID from current page
 * @return {string|null} User ID or null
 */
function extractUserIdFromUrl() {
  // Try to find user ID in page data or URL
  const profileLink = document.querySelector('a[href*="/users/"]');
  if (profileLink) {
    const match = profileLink.href.match(/\/users\/(\d+)/);
    if (match) return match[1];
  }
  
  // Fallback: extract from page scripts
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const script of scripts) {
    if (!script.textContent) continue;
    const match = script.textContent.match(/"user_id":(\d+)/);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Set up quick share button
 */
function setupQuickShare() {
  const userName = document.querySelector(SELECTORS.USER_NAME);
  if (!userName || !userName.parentElement) return;
  
  // Check if already added
  if (document.querySelector('.soundswitch-share-btn')) return;
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'soundswitch-share-btn';
  shareBtn.innerHTML = '📋 Copy Public URL';
  shareBtn.title = 'Copy profile URL to clipboard';
  
  shareBtn.addEventListener('click', copyPublicUrl);
  
  userName.parentElement.appendChild(shareBtn);
}

/**
 * Copy public profile URL to clipboard
 */
function copyPublicUrl() {
  const url = window.location.href.split('?')[0]; // Remove query params
  
  navigator.clipboard.writeText(url).then(() => {
    showNotification('✅ Profile URL copied to clipboard!');
  }).catch((error) => {
    console.error('Failed to copy URL:', error);
    showNotification('❌ Failed to copy URL');
  });
}

/**
 * Toggle dark mode
 * @see docs/webstore_best_practices.md - User preferences
 */
async function toggleDarkMode() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'toggleDarkMode' });
    darkModeEnabled = response.darkMode;
    applyDarkMode(darkModeEnabled);
    
    // Update menu text
    const menuItem = document.querySelector('[data-action="dark-mode"] .dark-mode-text');
    if (menuItem) {
      menuItem.textContent = `${darkModeEnabled ? 'Light' : 'Dark'} Mode`;
    }
  } catch (error) {
    console.error('Error toggling dark mode:', error);
  }
}

/**
 * Apply or remove dark mode
 * @param {boolean} enable - Whether to enable dark mode
 */
function applyDarkMode(enable) {
  if (enable) {
    document.documentElement.classList.add('soundswitch-dark-mode');
  } else {
    document.documentElement.classList.remove('soundswitch-dark-mode');
  }
}

/**
 * Show temporary notification
 * @param {string} message - Notification message
 */
function showNotification(message) {
  // Remove existing notifications
  const existing = document.querySelector('.soundswitch-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = 'soundswitch-notification';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/**
 * Observe page changes for SPA navigation
 * @see docs/mdn_webextensions_overview.md - Content script lifecycle
 */
function observePageChanges() {
  let lastUrl = location.href;
  
  // Use MutationObserver for SPA navigation detection
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      
      // Reset initialization flag
      isInitialized = false;
      
      // Reinitialize on navigation
      setTimeout(() => {
        if (isProfilePage()) {
          createToggleButton();
          applyViewMode();
          setupFeatures();
        } else if (toggleButton) {
          toggleButton.remove();
          toggleButton = null;
          removeViewIndicator();
        }
      }, 500); // Delay to let page render
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle messages from background script and popup
 * @see docs/mdn_webextensions_api.md - Message handling
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'alive' });
  } else if (request.action === 'viewModeChanged') {
    currentViewMode = request.mode;
    updateToggleButton();
    applyViewMode();
  }
  return false; // Synchronous response
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
} 