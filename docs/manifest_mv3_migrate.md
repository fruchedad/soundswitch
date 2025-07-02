# Migrating to Manifest V3

## Key Migration Steps

### 1. Update Manifest Version
```json
{
  "manifest_version": 3,
  // ... rest of manifest
}
```

### 2. Convert Background Scripts to Service Worker
```json
// MV2
"background": {
  "scripts": ["background.js"],
  "persistent": false
}

// MV3
"background": {
  "service_worker": "background.js"
}
```

### 3. Update Host Permissions
```json
// MV2
"permissions": ["tabs", "http://example.com/*"]

// MV3
"permissions": ["tabs"],
"host_permissions": ["http://example.com/*"]
```

### 4. Update Action API
```json
// MV2
"browser_action": {...}

// MV3
"action": {...}
```

### 5. Content Scripts Changes
- Use `chrome.scripting.executeScript()` instead of `chrome.tabs.executeScript()`
- Update CSS injection methods

### 6. Replace Blocking WebRequest
- Use `declarativeNetRequest` for network modifications
- Non-blocking observers still available

## Common Issues

1. **Service Worker Lifecycle**: Handle intermittent context
2. **Storage**: Use chrome.storage instead of localStorage
3. **Timers**: Re-register after service worker wakes
4. **Remote Code**: Bundle all JavaScript with extension 