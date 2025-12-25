/**
 * Shortcut definitions and IPC listener setup
 * This file is loaded by preload.js in the renderer context
 */

const handlers = require('./handlers');

/**
 * Initialize shortcut listeners
 * Called from preload.js after IPC bridge is set up
 */
function initShortcuts(ipcRenderer) {
  // Listen for shortcut messages from main process
  ipcRenderer.on('shortcut', (event, action, ...args) => {
    console.log(`[Shortcuts] Received: ${action}`, args);

    switch (action) {
      case 'focus-search':
        handlers.focusSearch();
        break;

      case 'focus-message-input':
        handlers.focusMessageInput();
        break;

      case 'switch-conversation':
        // args[0] is the 1-based conversation number
        const index = parseInt(args[0], 10) - 1; // Convert to 0-based
        handlers.switchToConversation(index);
        break;

      case 'previous-conversation':
        handlers.previousConversation();
        break;

      case 'next-conversation':
        handlers.nextConversation();
        break;

      case 'escape':
        handlers.handleEscape();
        break;

      default:
        console.warn(`[Shortcuts] Unknown action: ${action}`);
    }
  });

  console.log('[Shortcuts] Initialized and listening for IPC messages');
}

module.exports = { initShortcuts };
