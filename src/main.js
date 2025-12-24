const { app, BrowserWindow, session, shell, systemPreferences } = require('electron');
const path = require('path');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow;

function createWindow() {
  // Get persistent session
  const ses = session.fromPartition('persist:messenger');

  // Strip Electron/app identifiers from user agent
  const defaultUserAgent = ses.getUserAgent();
  const cleanUserAgent = defaultUserAgent
    .replace(/Electron\/[\d.]+\s*/g, '')
    .replace(/messenger-desktop-app\/[\d.]+\s*/g, '')
    .trim();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 10 },
    backgroundColor: '#1a1a1a',
    show: false, // Show when ready to prevent flash
    webPreferences: {
      partition: 'persist:messenger',
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Set clean user agent
  mainWindow.webContents.setUserAgent(cleanUserAgent);

  // Handle permission requests (camera, microphone for calls)
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['media', 'mediaKeySystem', 'clipboard-read', 'clipboard-sanitized-write'];
    callback(allowedPermissions.includes(permission));
  });

  // Handle permission checks
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (requestingOrigin.startsWith('https://www.messenger.com') ||
        requestingOrigin.startsWith('https://messenger.com')) {
      return true;
    }
    return false;
  });

  // Load messenger.com login page
  mainWindow.loadURL('https://www.messenger.com/login');

  // Inject CSS for title bar zone after page loads
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html, body {
        height: 100% !important;
        overflow: hidden !important;
        background-color: rgb(26, 26, 26) !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body > div:first-child {
        padding-top: 32px !important;
        box-sizing: border-box !important;
        height: 100% !important;
      }
      /* Hide any scrollbar on the outer html/body elements */
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
      }
    `);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links and popup windows (including call windows)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow about:blank popups (used by messenger.com for calls)
    if (url === 'about:blank') {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            partition: 'persist:messenger',
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
          },
        },
      };
    }

    // Open external links in default browser
    if (!url.startsWith('https://www.messenger.com') &&
        !url.startsWith('https://www.facebook.com') &&
        !url.startsWith('https://facebook.com')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    // Allow messenger/facebook popups with proper configuration
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        webPreferences: {
          partition: 'persist:messenger',
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
        },
      },
    };
  });

  // Handle navigation to keep user on messenger.com
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Allow messenger.com, facebook.com (for login)
    if (!url.startsWith('https://www.messenger.com') &&
        !url.startsWith('https://www.facebook.com') &&
        !url.startsWith('https://facebook.com') &&
        !url.startsWith('https://m.facebook.com')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Request camera/microphone permissions on macOS
async function requestMediaPermissions() {
  if (process.platform === 'darwin') {
    const micStatus = systemPreferences.getMediaAccessStatus('microphone');
    const camStatus = systemPreferences.getMediaAccessStatus('camera');

    if (micStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('microphone');
    }
    if (camStatus !== 'granted') {
      await systemPreferences.askForMediaAccess('camera');
    }
  }
}

app.whenReady().then(async () => {
  await requestMediaPermissions();
  createWindow();
});

// Handle second instance (focus existing window)
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// macOS: Re-create window when dock icon clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Quit when all windows closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
