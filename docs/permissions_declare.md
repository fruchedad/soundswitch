# Declaring Permissions

## Permission Types

### 1. API Permissions
Permissions for Chrome APIs:
```json
"permissions": [
  "storage",
  "tabs",
  "cookies",
  "activeTab"
]
```

### 2. Host Permissions
Access to specific sites:
```json
"host_permissions": [
  "https://*.soundcloud.com/*",
  "https://api.soundcloud.com/*"
]
```

### 3. Optional Permissions
Request at runtime:
```json
"optional_permissions": [
  "downloads",
  "notifications"
]
```

## Best Practices

1. **Minimal Permissions**: Only request what you need
2. **Justify Permissions**: Explain why each is needed
3. **Progressive Enhancement**: Use optional permissions
4. **Narrow Host Patterns**: Be specific with URLs

## Common Permission Patterns

### Content Modification
```json
{
  "permissions": ["activeTab"],
  "host_permissions": ["https://example.com/*"]
}
```

### API Access
```json
{
  "permissions": ["storage", "cookies"],
  "host_permissions": ["https://api.example.com/*"]
}
```

### Background Processing
```json
{
  "permissions": ["alarms", "storage"]
}
```

## Permission Warnings

Some permissions trigger install warnings:
- `tabs`: Access browser tabs
- `cookies`: Read/write cookies
- All host permissions: Access data on sites 