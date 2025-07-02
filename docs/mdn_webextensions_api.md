# WebExtensions API Reference

## Core APIs

### chrome.runtime
```javascript
// Get extension details
chrome.runtime.getManifest();

// Message passing
chrome.runtime.sendMessage(message, callback);
chrome.runtime.onMessage.addListener(listener);

// Extension lifecycle
chrome.runtime.onInstalled.addListener(callback);
chrome.runtime.onSuspend.addListener(callback);
```

### chrome.storage
```javascript
// Local storage
chrome.storage.local.set({key: value});
chrome.storage.local.get(['key'], callback);
chrome.storage.local.remove(['key']);

// Sync storage
chrome.storage.sync.set({key: value});
chrome.storage.sync.get(['key'], callback);

// Storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  console.log(changes, area);
});
```

### chrome.tabs
```javascript
// Query tabs
chrome.tabs.query({active: true}, callback);

// Create tab
chrome.tabs.create({url: 'https://example.com'});

// Update tab
chrome.tabs.update(tabId, {url: newUrl});

// Execute script (MV3)
chrome.scripting.executeScript({
  target: {tabId: tab.id},
  function: contentFunction
});
```

### chrome.cookies
```javascript
// Get cookie
chrome.cookies.get({
  url: 'https://example.com',
  name: 'session'
}, callback);

// Set cookie
chrome.cookies.set({
  url: 'https://example.com',
  name: 'session',
  value: 'abc123'
});
```

## Content Script APIs

### DOM Manipulation
```javascript
// Inject into page
document.body.insertAdjacentHTML('beforeend', '<div>Content</div>');

// Modify styles
document.documentElement.style.setProperty('--color', '#000');
```

### Communication
```javascript
// Send to background
chrome.runtime.sendMessage({from: 'content', data: value});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle message
  sendResponse({success: true});
}); 