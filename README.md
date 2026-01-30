# X Highlighter

A powerful browser extension for highlighting and organizing text on X.com (Twitter).

## Features

- **Highlight Text**: Select any text on X.com and press `Ctrl+H` to highlight it
- **Color Selection**: Choose from 5 different highlight colors
- **Persistent Storage**: Your highlights are saved automatically and restored when you revisit pages
- **Full Management UI**: View, search, and delete all your highlights from the popup
- **Export/Import**: Backup your highlights or transfer them between browsers
- **Keyboard Shortcuts**: Full keyboard support for efficient highlighting
- **Tooltips**: Hover over highlights to see the highlighted text

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Highlight selection | `Ctrl+H` |
| Cycle colors | `Ctrl+Shift+C` |
| Remove highlight | `Ctrl+Shift+R` |
| Open popup | `Ctrl+Shift+H` |

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `xmaker` folder

## Usage

1. Visit X.com or Twitter.com
2. Select any text you want to highlight
3. Click the highlight button or press `Ctrl+H`
4. Use the color button to change highlight colors
5. Click the extension icon to manage all your highlights

## Files

- `manifest.json` - Extension configuration
- `content.js` - Page interaction script
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic
- `background.js` - Background service worker
- `styles.css` - Content script styles

## Privacy

All data is stored locally in your browser. No data is sent to any external servers.

## License

MIT
