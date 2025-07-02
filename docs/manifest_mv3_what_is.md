# Chrome Extension Manifest V3

## What is Manifest V3?

Manifest V3 (MV3) is the latest version of the Chrome extension platform. It introduces significant changes to improve security, privacy, and performance.

## Key Changes from V2

### 1. Service Workers Instead of Background Pages
- Background pages replaced with service workers
- Event-driven, terminates when idle
- No persistent background context

### 2. Enhanced Security
- Content Security Policy (CSP) is stricter
- No remote code execution
- All code must be bundled with extension

### 3. New Permissions Model
- More granular permissions
- Host permissions separated from API permissions
- Runtime permission requests

### 4. Declarative Net Request API
- Replace webRequest blocking with declarative rules
- Better performance
- Enhanced privacy

## Migration Requirements

1. Update manifest version to 3
2. Convert background scripts to service workers
3. Update API calls to V3 syntax
4. Review and update permissions

## Benefits

- Improved performance
- Better privacy guarantees
- Enhanced security model
- Modern web platform alignment 