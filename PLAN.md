# Messenger Desktop App for macOS

A native macOS wrapper for Facebook Messenger (messenger.com) built with Electron.

## Requirements

### In Scope
- Native macOS app wrapping messenger.com
- Persistent login (stay logged in after quitting and reopening)
- Window resizing with sensible minimum size
- Drag and drop file uploads
- Voice/video calls (nice-to-have)
- Distribution to others (code signing planned for later)

### Out of Scope
- Desktop notifications
- Native UI or settings panel
- Cross-platform support (macOS only for now)

## Post-Deprecation Research (Dec 2025)

Meta discontinued the official Messenger desktop app on Dec 15, 2025. Key findings from analyzing recent community wrappers:

### Confirmed Working (Dec 2025)
- **Basic Electron wrappers still work** - messenger.com has not blocked third-party wrappers
- **Session persistence works** - `persist:` partition cookies survive app restarts
- **Login works normally** - No special authentication handling needed
- **WebRTC calls work** - Voice/video calls function in Electron's Chromium

### Why Caprine Has Issues (Not Relevant to Us)
Caprine's problems are specific to their custom modifications:
- Clickable areas bug = CSS/layout issues from their custom styling
- Login issues = Pre-date deprecation, related to their JS injection
- We're building a **vanilla wrapper** with no custom CSS/JS, avoiding these issues

### Key Learnings from Working Implementations
| Repo | Approach | Status |
|------|----------|--------|
| shaoruu/messenger | Chrome UA, persist session | Working |
| aadaam/my-messenger | Strip Electron from UA | Working |
| JensPauwels/messenger | Wails/Go wrapper | Working |

### Critical Design Principles
1. **Keep it vanilla** - Don't inject custom CSS or JS into messenger.com
2. **Strip Electron identifiers** - Remove "Electron/x.x.x" from user agent
3. **No modifications** - Load messenger.com exactly as a browser would
4. **Simple is resilient** - Less code = less to break when Meta updates

### E2E Encryption Note
Users with end-to-end encrypted chats should set up **Secure Storage** (PIN backup) on messenger.com web first. This ensures encrypted message history is preserved - not wrapper-specific, affects all clients.

## Technology Choice

**Electron** - Selected for:
- Fastest development time (~1 hour for MVP)
- Excellent session/cookie persistence via `persist:` partition
- Perfect WebRTC support for voice/video calls
- Drag & drop works out-of-box
- Proven approach - multiple Dec 2025 wrappers confirm it works

Trade-off: Larger app size (~150-200MB) vs Swift's ~50MB, but reliability and dev speed win for this project.

## Project Structure

```
messenger-desktop-app/
├── package.json              # Project config and build settings
├── src/
│   ├── main.js               # Electron main process
│   └── preload.js            # Security preload script
├── build/
│   ├── entitlements.mac.plist # macOS permissions
│   └── icon.icns             # App icon (to be added)
├── PLAN.md                   # This file
└── README.md                 # User documentation
```

## Technical Details

### Key Configuration
- **User Agent**: Strip Electron/app identifiers from default UA (keeps Chrome base)
- **Session**: `persist:messenger` partition for cookie/localStorage persistence
- **Window**: `titleBarStyle: 'hiddenInset'` for native macOS appearance
- **Permissions**: Camera & microphone access for calls
- **No JS injection**: Load messenger.com vanilla, no custom scripts

### Dependencies
```json
{
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0"
  }
}
```

### Critical Implementation Points

1. **Session Persistence**
   - Use `session.fromPartition('persist:messenger')`
   - Third-party cookies enabled by default
   - No additional storage libraries needed

2. **User Agent Override**
   - Required: Safari-based UA string
   - Without this, messenger.com may show mobile layout

3. **WebRTC for Calls**
   - Permission handler must allow 'media' permission
   - macOS requires `systemPreferences.askForMediaAccess()`
   - Entitlements needed for signed builds

4. **External Links**
   - Open non-Messenger/Facebook URLs in default browser
   - Allow navigation to facebook.com for login flow

## Implementation Phases

### Phase 1: Basic App (MVP)
1. Initialize npm project with Electron
2. Create main.js with BrowserWindow loading messenger.com
3. Add session persistence configuration
4. Add user agent override
5. Test: Login persists after app restart

### Phase 2: Window Polish
6. Add native macOS title bar style
7. Add window size constraints (min 400x400)
8. Add single-instance lock
9. Add external link handling

### Phase 3: Calls Support
10. Add permission request handler
11. Add macOS media permission prompts
12. Create preload.js for security
13. Test: Voice/video calls work

### Phase 4: Build Setup
14. Install electron-builder
15. Create entitlements.mac.plist
16. Configure package.json build section
17. Add app icon
18. Create unsigned DMG build

### Phase 5: Distribution (Future)
19. Set up Apple Developer account
20. Generate Developer ID certificate
21. Add notarization script
22. Create signed, notarized builds

## Build Commands

```bash
# Development
npm start

# Production (unsigned, for testing)
npm run build:unsigned

# Production (signed, when ready)
npm run build
```

## Code Signing Notes (For Later)

When ready to distribute:
1. Apple Developer account required ($99/year)
2. Create "Developer ID Application" certificate
3. Install certificate in Keychain
4. Set environment variables:
   - `APPLE_ID`
   - `APPLE_ID_PASSWORD` (app-specific password)
   - `APPLE_TEAM_ID`
5. Add `@electron/notarize` package
6. Run signed build

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login doesn't persist | Verify `persist:` prefix in partition |
| Mobile layout shows | Check user agent includes "Safari" |
| Calls don't work | Check entitlements and permission handler |
| Can't open app (Gatekeeper) | Use unsigned build locally, or set up signing |

## References

- [Caprine](https://github.com/sindresorhus/caprine) - Reference Electron Messenger wrapper
- [Electron Session API](https://www.electronjs.org/docs/latest/api/session)
- [electron-builder macOS docs](https://www.electron.build/mac)
