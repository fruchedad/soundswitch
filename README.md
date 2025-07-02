# SoundSwitch - Chrome Extension for SoundCloud

A powerful Chrome extension that allows you to toggle between public and authenticated views on SoundCloud profiles, plus additional power-user features.

## Features

### 🔄 View Switching
- **Public View**: See exactly what anonymous visitors see on your profile
- **User View**: See your full authenticated profile with all private content

### 🎯 Power Features
- **Auto-Hide Private Tracks**: Automatically collapse private tracks with toggle links
- **Hover Stats**: View 7-day follower growth on hover over follower counts
- **Quick Share**: Copy public profile URL with one click
- **Dark Mode**: Beautiful dark theme for SoundCloud

### 🛡️ Privacy Controls
When in Public View mode, the extension hides:
- Follower and following counts
- Likes and reposts tabs
- Private tracks and playlists
- Comments sections
- Detailed track statistics

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `soundswitch` folder
6. The extension icon should appear in your toolbar

### From Chrome Web Store
*(Coming soon)*

## Usage

### Basic Usage

1. **Visit any SoundCloud profile page**
2. **Look for the floating toggle button** in the bottom right corner
3. **Click to switch between views**:
   - 🔒 User View: Your authenticated view
   - 👀 Public View: What visitors see

### Popup Controls

Click the extension icon in your toolbar to access:
- Quick view mode switching
- Feature toggles (dark mode, auto-hide, stats)
- Copy current profile URL
- Clear stats cache

### Keyboard Shortcuts

*(Coming in future update)*

## Features in Detail

### View Mode Toggle
The extension adds a floating button on all SoundCloud profile pages. Click it to instantly switch between public and user views. The page updates in real-time without requiring a refresh.

### Private Track Management
Private tracks are automatically collapsed with a "🔓 Show Private Track" link. You can:
- Toggle individual tracks
- Use the menu to show/hide all private tracks at once

### Follower Growth Stats
Hover over any follower count to see:
- New followers in the last 7 days
- Growth rate percentage
- Total follower count

### Dark Mode
A beautiful dark theme that inverts colors while preserving images and videos. Toggle it from the extension popup or the floating menu.

## Permissions Explained

The extension requires these permissions:
- **cookies**: To detect if you're logged into SoundCloud
- **activeTab**: To modify the current SoundCloud tab
- **storage**: To save your preferences
- **host permissions**: To access SoundCloud API for stats

## Privacy

- No data is collected or transmitted to external servers
- All processing happens locally in your browser
- Stats are cached locally for 5 minutes to reduce API calls
- Your SoundCloud credentials are never accessed

## Troubleshooting

### Extension not working?
1. Make sure you're on a SoundCloud profile page
2. Try refreshing the page
3. Check if the extension is enabled in `chrome://extensions/`

### Stats not loading?
- The SoundCloud API may be rate-limited
- Try clearing the cache from the popup menu
- Wait a few minutes and try again

### View toggle not appearing?
- The extension only works on profile pages
- It won't appear on search, stream, or discover pages

## Development

### Project Structure
```
soundswitch/
├── manifest.json          # Extension manifest (MV3)
├── background.js          # Service worker for API calls
├── content.js            # Content script for DOM manipulation
├── content.css           # Styles for injected elements
├── popup.html/js/css     # Extension popup interface
├── icons/                # Extension icons
├── docs/                 # Reference documentation
└── README.md            # This file
```

### Building from Source
No build process required! The extension uses vanilla JavaScript and can be loaded directly.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different SoundCloud pages
5. Submit a pull request

## API References

This extension was built using:
- [SoundCloud API Documentation](https://developers.soundcloud.com/docs/api/guide)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/webstore/best-practices)

## Known Issues

- Follower stats may be approximate due to API limitations
- Some SoundCloud page layouts may not be fully supported
- Dark mode may not work perfectly with all custom profile themes

## Future Features

- [ ] Keyboard shortcuts for quick toggle
- [ ] Export view statistics
- [ ] Bulk privacy settings management
- [ ] Profile comparison tool
- [ ] Enhanced analytics dashboard

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/soundswitch/issues)
- **Wiki**: [Documentation](https://github.com/yourusername/soundswitch/wiki)

## License

MIT License - See LICENSE file for details

---

Made with ❤️ for the SoundCloud community 