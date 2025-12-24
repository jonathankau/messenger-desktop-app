// Minimal preload script for security (contextIsolation boundary)
// No APIs exposed - messenger.com runs in isolated context

window.addEventListener('DOMContentLoaded', () => {
  console.log('Messenger Desktop loaded');
});
