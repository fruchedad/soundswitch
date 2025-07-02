# WebExtensions Overview

## What are WebExtensions?

WebExtensions are a cross-browser system for developing browser extensions. The API is largely compatible with Chrome's extension API.

## Core Components

### 1. Manifest File
```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0",
  "description": "Brief description"
}
```

### 2. Background Scripts
- Run in background
- Handle events
- Manage extension state

### 3. Content Scripts
- Run in web page context
- Access and modify DOM
- Communicate with background

### 4. Popup/Options Pages
- User interface elements
- HTML/CSS/JavaScript

## Key APIs

### Storage
```javascript
// Save data
chrome.storage.local.set({key: 'value'});

// Retrieve data
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key);
});
```

### Messaging
```javascript
// Send message
chrome.runtime.sendMessage({action: 'getData'});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    sendResponse({data: 'value'});
  }
});
```

### Tabs
```javascript
// Query tabs
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  console.log(tabs[0].url);
});
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Most APIs supported
- Safari: Limited support
- Opera: Chrome-compatible 