/**
 * Preload script - bridge between Electron main process and renderer
 * Sets up IPC communication for keyboard shortcuts
 */

const { ipcRenderer } = require('electron');
const { initShortcuts } = require('./shortcuts');

// Initialize shortcuts when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Messenger Desktop loaded');

  // Initialize keyboard shortcut handlers
  initShortcuts(ipcRenderer);
});
