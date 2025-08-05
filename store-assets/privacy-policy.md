# Privacy Policy for SoundSwitch Chrome Extension

**Last Updated:** January 2024

## Overview

SoundSwitch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension for SoundCloud operates and what data, if any, is collected when you use our service.

## Data Collection and Usage

### No Personal Data Collection
**SoundSwitch does not collect, store, or transmit any personal data.** All functionality operates entirely within your browser using local storage and SoundCloud's public APIs.

### What We Don't Collect
- Personal identification information
- SoundCloud login credentials
- Browsing history outside of SoundCloud
- Email addresses or contact information
- Usage analytics or behavioral data
- Device information or system details
- Location data
- Any form of personally identifiable information (PII)

## Local Data Storage

SoundSwitch uses your browser's local storage to save:

### User Preferences
- View mode preference (public/user)
- Dark mode setting
- Private track visibility preferences
- Other UI customization settings

### Temporary Cache
- SoundCloud API responses for follower growth statistics
- Cached data expires automatically after 5 minutes
- No personal content is cached, only numerical statistics

### How Local Storage Works
- All data stays on your device
- Data is never transmitted to external servers
- You can clear this data anytime through browser settings
- Data is automatically cleaned up when the extension is uninstalled

## Permissions Explanation

SoundSwitch requests the following permissions for legitimate functionality:

### `cookies`
- **Purpose**: Detect if you're logged into SoundCloud to provide appropriate view mode
- **Scope**: Only reads SoundCloud authentication status
- **Data Access**: No cookie content is accessed or stored

### `activeTab`
- **Purpose**: Modify the current SoundCloud tab to enable view switching
- **Scope**: Only active SoundCloud tabs
- **Data Access**: No tab data is collected or transmitted

### `storage`
- **Purpose**: Save your preferences locally in your browser
- **Scope**: Local browser storage only
- **Data Access**: Only extension settings, no personal data

### `scripting`
- **Purpose**: Inject view switching functionality into SoundCloud pages
- **Scope**: SoundCloud domains only
- **Data Access**: No script data is collected

### `alarms`
- **Purpose**: Schedule automatic cleanup of cached analytics data
- **Scope**: Internal extension timers only
- **Data Access**: No alarm data is accessed

### Host Permissions
- **`https://*.soundcloud.com/*`**: Required to modify SoundCloud pages
- **`https://api.soundcloud.com/*`**: Required for public analytics data
- **`https://api-v2.soundcloud.com/*`**: Required for enhanced analytics features

## Third-Party Services

### SoundCloud API
- SoundSwitch uses SoundCloud's public API to fetch follower statistics
- Only publicly available data is accessed
- API requests are made directly from your browser to SoundCloud
- No data is routed through our servers

### No External Servers
- SoundSwitch operates entirely client-side
- No external servers are used for data processing
- No data is transmitted to third parties
- No analytics or tracking services are integrated

## Data Security

### Local Operation
- All processing happens within your browser
- No data transmission to external servers
- Industry-standard browser security protections apply

### No Account Creation
- No user accounts or registration required
- No login credentials stored or processed
- No user identification systems

## Children's Privacy

SoundSwitch does not collect any data from anyone, including children under 13. Since no personal information is collected, processed, or stored, there are no special considerations regarding children's privacy.

## International Users

Since SoundSwitch operates entirely within your browser and doesn't collect or transmit data, there are no cross-border data transfer concerns. All data remains on your local device.

## Your Rights and Controls

### Data Control
- You have complete control over your local extension data
- Clear extension data through Chrome's extension settings
- Disable the extension at any time
- Uninstall removes all local data

### Browser Controls
- Use browser's privacy controls for additional protection
- Clear browser storage to remove cached data
- Disable extension permissions through browser settings

## Changes to This Policy

We may update this Privacy Policy to reflect changes in our practices or for legal compliance. We will:
- Update the "Last Updated" date at the top of this policy
- Notify users of significant changes through extension updates
- Maintain transparency about any changes

## Compliance

This Privacy Policy complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable privacy regulations

## Contact Information

If you have questions about this Privacy Policy or SoundSwitch:

- **GitHub Issues**: [Create an issue](https://github.com/yourusername/soundswitch/issues)
- **Email**: privacy@soundswitch.app
- **Documentation**: Available in our GitHub repository

## Verification

You can verify our privacy claims by:
- Reviewing our open-source code on GitHub
- Examining network traffic while using the extension
- Checking browser storage for any collected data
- Reviewing Chrome extension permissions

## Summary

SoundSwitch is designed with privacy as a core principle:
- ✅ No data collection
- ✅ No external servers
- ✅ No tracking or analytics
- ✅ No personal information access
- ✅ Complete local operation
- ✅ Full user control
- ✅ Open source transparency

Your privacy is paramount, and SoundSwitch is built to respect and protect it completely.