# Chrome Extension Permissions List

## Commonly Used Permissions

### activeTab
- Access to current tab when user invokes extension
- No install warning
- Safest tab permission

### cookies
- Read and modify cookies
- Requires host permissions for domains

### storage
- Store data using chrome.storage API
- Syncs across devices
- No install warning

### tabs
- Access to tab properties and methods
- Can read URLs and titles of all tabs
- Shows install warning

### scripting
- Inject scripts and CSS into pages
- Replaces older content script APIs
- MV3 recommended approach

### webRequest
- Observe and analyze traffic
- Non-blocking in MV3

### declarativeNetRequest
- Modify network requests declaratively
- MV3 replacement for blocking webRequest

## Host Permissions Patterns

### Specific Site
```
"https://soundcloud.com/*"
```

### All Subdomains
```
"https://*.soundcloud.com/*"
```

### Multiple Protocols
```
"*://example.com/*"
```

### All URLs (avoid if possible)
```
"<all_urls>"
```

## Optional Permissions

Request these at runtime:
- downloads
- notifications
- clipboardWrite
- geolocation 