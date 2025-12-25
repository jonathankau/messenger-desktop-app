# Messenger Desktop

Unofficial desktop app for Facebook Messenger (macOS)

## Features

- Native macOS app experience
- Keyboard shortcuts (Cmd+1-9, Cmd+F, etc.)
- Persistent login
- Voice/video call support
- Unsigned builds for local use

## Download

### For Users (Pre-built)

1. Go to the [Releases](https://github.com/jonathankau/messenger-desktop-app/releases) page
2. Download the DMG for your Mac:
   - **Apple Silicon (M1/M2/M3)**: `Messenger-1.0.0-arm64.dmg`
   - **Intel**: `Messenger-1.0.0.dmg`
3. Open the DMG and drag Messenger to Applications
4. **First launch**: Right-click the app → Open (to bypass Gatekeeper for unsigned app)

### For Developers (Build from Source)

**Prerequisites**: Node.js 18+

```bash
git clone https://github.com/jonathankau/messenger-desktop-app.git
cd messenger-desktop-app
npm install
npm start              # Run in dev mode
npm run build:unsigned # Build DMG
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+1-9 | Switch to conversation 1-9 |
| Cmd+[ | Previous conversation |
| Cmd+] | Next conversation |
| Cmd+F | Search conversations |
| Cmd+K | Search (alternative) |
| Cmd+I | Focus message input |
| Cmd+/ | Show shortcuts help |
| Esc | Return to message input |

## Contributing

PRs welcome! Please open an issue first for major changes.

## License

MIT

## Disclaimer

This is an unofficial app not affiliated with Meta/Facebook. Use at your own risk.
