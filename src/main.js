const { app, BrowserWindow, session, shell, systemPreferences, Menu } = require('electron');
const path = require('path');

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow;
let helpWindow;

/**
 * Send a shortcut action to the renderer process
 */
function sendShortcut(action, ...args) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('shortcut', action, ...args);
  }
}

/**
 * Open the keyboard shortcuts help window
 */
function openHelpWindow() {
  if (helpWindow) {
    helpWindow.focus();
    return;
  }

  helpWindow = new BrowserWindow({
    width: 480,
    height: 520,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Keyboard Shortcuts',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  helpWindow.loadFile(path.join(__dirname, 'help.html'));

  helpWindow.on('closed', () => {
    helpWindow = null;
  });
}

/**
 * Create the application menu with keyboard shortcuts
 */
function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),

    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },

    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },

    // Navigate menu (custom shortcuts)
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+F',
          click: () => sendShortcut('focus-search'),
        },
        {
          label: 'Search (Alt)',
          accelerator: 'CmdOrCtrl+K',
          click: () => sendShortcut('focus-search'),
        },
        { type: 'separator' },
        {
          label: 'Previous Conversation',
          accelerator: 'CmdOrCtrl+[',
          click: () => sendShortcut('previous-conversation'),
        },
        {
          label: 'Next Conversation',
          accelerator: 'CmdOrCtrl+]',
          click: () => sendShortcut('next-conversation'),
        },
        { type: 'separator' },
        // Conversation 1-9 shortcuts
        ...Array.from({ length: 9 }, (_, i) => ({
          label: `Conversation ${i + 1}`,
          accelerator: `CmdOrCtrl+${i + 1}`,
          click: () => sendShortcut('switch-conversation', i + 1),
        })),
      ],
    },

    // Message menu
    {
      label: 'Message',
      submenu: [
        {
          label: 'Focus Message Input',
          accelerator: 'CmdOrCtrl+I',
          click: () => sendShortcut('focus-message-input'),
        },
        {
          label: 'Return to Input',
          accelerator: 'Escape',
          click: () => sendShortcut('escape'),
        },
      ],
    },

    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
        ] : [
          { role: 'close' },
        ]),
      ],
    },

    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+/',
          click: () => openHelpWindow(),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

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
        requestingOrigin.startsWith('https://messenger.com') ||
        requestingOrigin.startsWith('https://www.facebook.com') ||
        requestingOrigin.startsWith('https://facebook.com')) {
      return true;
    }
    return false;
  });

  // Load Facebook Messages
  mainWindow.loadURL('https://www.facebook.com/messages');

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
      /* Hide the Facebook top navigation banner */
      [role="banner"] {
        display: none !important;
      }
      /* Hide any scrollbar on the outer html/body elements */
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
      }
    `);

    // Hide the Facebook nav bar via JS as a fallback for SPA re-renders
    mainWindow.webContents.executeJavaScript(`
      (function hideBanner() {
        const banner = document.querySelector('[role="banner"]');
        if (banner) banner.style.setProperty('display', 'none', 'important');

        new MutationObserver(() => {
          const b = document.querySelector('[role="banner"]');
          if (b && b.style.display !== 'none') {
            b.style.setProperty('display', 'none', 'important');
          }
        }).observe(document.body, { childList: true, subtree: true });
      })();
    `);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Right-click context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menuTemplate = [];

    if (params.isEditable) {
      if (params.editFlags.canUndo) menuTemplate.push({ role: 'undo' });
      if (params.editFlags.canRedo) menuTemplate.push({ role: 'redo' });
      if (menuTemplate.length > 0) menuTemplate.push({ type: 'separator' });
      if (params.editFlags.canCut) menuTemplate.push({ role: 'cut' });
      if (params.editFlags.canCopy) menuTemplate.push({ role: 'copy' });
      if (params.editFlags.canPaste) menuTemplate.push({ role: 'paste' });
      if (params.editFlags.canSelectAll) {
        menuTemplate.push({ type: 'separator' });
        menuTemplate.push({ role: 'selectAll' });
      }
    } else if (params.selectionText) {
      menuTemplate.push({ role: 'copy' });
    }

    if (params.linkURL) {
      if (menuTemplate.length > 0) menuTemplate.push({ type: 'separator' });
      menuTemplate.push({
        label: 'Copy Link',
        click: () => {
          const { clipboard } = require('electron');
          clipboard.writeText(params.linkURL);
        },
      });
    }

    if (menuTemplate.length > 0) {
      Menu.buildFromTemplate(menuTemplate).popup();
    }
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
  createMenu();
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
