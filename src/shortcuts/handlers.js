/**
 * Keyboard shortcut handlers for messenger.com
 * These functions manipulate the DOM in response to shortcuts
 */

const { finder, selectors } = require('./selectors');

/**
 * Validate that an element is actually a conversation link
 * @param {Element} el - Element to validate
 * @returns {boolean}
 */
function isValidConversationLink(el) {
  // Must have visible text content (conversation name)
  const hasText = el.textContent.trim().length > 0;

  // Must be reasonably sized (not a tiny icon)
  const rect = el.getBoundingClientRect();
  const hasSize = rect.width > 50 && rect.height > 30;

  // Must not be in the left sidebar nav (which has aria-label on its links)
  const hasAriaLabel = el.hasAttribute('aria-label');

  // Must not be a "More options" button
  const isMoreButton = el.getAttribute('aria-label')?.includes('More options');

  return hasText && hasSize && !hasAriaLabel && !isMoreButton;
}

/**
 * Focus the search input
 */
function focusSearch() {
  const searchInput = finder.findElement('searchInput', selectors.searchInput);
  if (searchInput) {
    searchInput.focus();
    searchInput.click();
    console.log('[Shortcuts] Focused search input');
    return true;
  }
  return false;
}

/**
 * Focus the message input
 */
function focusMessageInput() {
  const messageInput = finder.findElement('messageInput', selectors.messageInput);
  if (messageInput) {
    messageInput.focus();
    messageInput.click();
    console.log('[Shortcuts] Focused message input');
    return true;
  }
  return false;
}

/**
 * Switch to conversation at index (0-based)
 * @param {number} index - 0-based index of conversation
 */
function switchToConversation(index) {
  const rawConversations = finder.findElements('conversationList', selectors.conversationList);

  // Filter to only valid conversation links
  const conversations = rawConversations.filter(isValidConversationLink);

  // Log health info
  console.log(`[Shortcuts] Found ${rawConversations.length} raw elements, ${conversations.length} valid conversations`);

  if (conversations.length === 0) {
    console.warn('[Shortcuts] No valid conversations found');
    // Log what we got for debugging
    rawConversations.slice(0, 3).forEach((el, i) => {
      console.warn(`[Shortcuts] Raw element ${i}:`, el.tagName, el.getAttribute('aria-label') || 'no label');
    });
    return false;
  }

  if (index >= conversations.length) {
    console.warn(`[Shortcuts] Conversation index ${index} out of range (${conversations.length} available)`);
    return false;
  }

  const conversation = conversations[index];
  if (conversation) {
    conversation.click();
    console.log(`[Shortcuts] Switched to conversation ${index + 1}`);
    return true;
  }
  return false;
}

/**
 * Get the index of the currently active conversation
 * @returns {number} Index or -1 if not found
 */
function getActiveConversationIndex() {
  const rawConversations = finder.findElements('conversationList', selectors.conversationList);
  const conversations = rawConversations.filter(isValidConversationLink);
  const active = finder.findElement('activeConversation', selectors.activeConversation);

  if (!active || conversations.length === 0) {
    return -1;
  }

  // Find the active conversation in the list
  for (let i = 0; i < conversations.length; i++) {
    if (conversations[i] === active || conversations[i].contains(active) || active.contains(conversations[i])) {
      return i;
    }
  }

  // Fallback: check aria-current="page" on each
  for (let i = 0; i < conversations.length; i++) {
    if (conversations[i].getAttribute('aria-current') === 'page') {
      return i;
    }
  }

  return -1;
}

/**
 * Navigate to previous conversation
 */
function previousConversation() {
  const currentIndex = getActiveConversationIndex();
  const rawConversations = finder.findElements('conversationList', selectors.conversationList);
  const conversations = rawConversations.filter(isValidConversationLink);

  if (conversations.length === 0) {
    return false;
  }

  // If no active conversation or at first, go to last
  const newIndex = currentIndex <= 0 ? conversations.length - 1 : currentIndex - 1;
  return switchToConversation(newIndex);
}

/**
 * Navigate to next conversation
 */
function nextConversation() {
  const currentIndex = getActiveConversationIndex();
  const rawConversations = finder.findElements('conversationList', selectors.conversationList);
  const conversations = rawConversations.filter(isValidConversationLink);

  if (conversations.length === 0) {
    return false;
  }

  // If no active conversation or at last, go to first
  const newIndex = currentIndex < 0 || currentIndex >= conversations.length - 1 ? 0 : currentIndex + 1;
  return switchToConversation(newIndex);
}

/**
 * Handle Escape key - return to message input or cancel search
 */
function handleEscape() {
  // First check if search is focused, blur it
  const searchInput = finder.findElement('searchInput', selectors.searchInput);
  if (searchInput && document.activeElement === searchInput) {
    searchInput.blur();
    // Then focus message input
    focusMessageInput();
    console.log('[Shortcuts] Escaped from search');
    return true;
  }

  // Otherwise just focus message input
  return focusMessageInput();
}

module.exports = {
  focusSearch,
  focusMessageInput,
  switchToConversation,
  previousConversation,
  nextConversation,
  handleEscape,
};
