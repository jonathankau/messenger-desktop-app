/**
 * Resilient element finding for messenger.com
 * Uses ARIA attributes as primary selectors (most stable across updates)
 */

class ResilientElementFinder {
  constructor() {
    this.cache = new Map();
    this.lastSuccessfulStrategy = new Map();
  }

  /**
   * Find an element using multiple fallback strategies
   * @param {string} key - Identifier for this element type
   * @param {Array<Function>} strategies - Array of selector functions to try
   * @returns {Element|null}
   */
  findElement(key, strategies) {
    // Try last successful strategy first
    const lastStrategy = this.lastSuccessfulStrategy.get(key);
    if (lastStrategy) {
      try {
        const el = lastStrategy();
        if (el && this.isVisible(el)) {
          return el;
        }
      } catch (e) {
        // Strategy failed, try others
      }
    }

    // Try all strategies in order
    for (const strategy of strategies) {
      try {
        const el = strategy();
        if (el && this.isVisible(el)) {
          this.lastSuccessfulStrategy.set(key, strategy);
          return el;
        }
      } catch (e) {
        console.debug(`[Shortcuts] Strategy failed for ${key}:`, e.message);
      }
    }

    console.warn(`[Shortcuts] Could not find element: ${key}`);
    return null;
  }

  /**
   * Find multiple elements using fallback strategies
   * @param {string} key - Identifier for this element type
   * @param {Array<Function>} strategies - Array of selector functions returning NodeList/Array
   * @returns {Array<Element>}
   */
  findElements(key, strategies) {
    for (const strategy of strategies) {
      try {
        const els = strategy();
        if (els && els.length > 0) {
          return Array.from(els);
        }
      } catch (e) {
        console.debug(`[Shortcuts] Strategy failed for ${key}:`, e.message);
      }
    }

    console.warn(`[Shortcuts] Could not find elements: ${key}`);
    return [];
  }

  /**
   * Check if element is visible in the DOM
   */
  isVisible(el) {
    return el && el.offsetParent !== null;
  }
}

// Singleton instance
const finder = new ResilientElementFinder();

/**
 * Selector strategies for messenger.com elements
 * Ordered by reliability (ARIA first, then data attributes, then structure)
 */
const selectors = {
  searchInput: [
    // Messenger-specific search (facebook.com/messages)
    () => document.querySelector('[aria-label="Search Messenger" i]'),
    // ARIA-based (most reliable) — skip elements inside the hidden banner
    () => Array.from(document.querySelectorAll('[aria-label*="Search" i]')).find(el => !el.closest('[role="banner"]')),
    () => Array.from(document.querySelectorAll('input[placeholder*="Search" i]')).find(el => !el.closest('[role="banner"]')),
    () => document.querySelector('[role="search"] input'),
    // Fallback: any visible search-like input
    () => Array.from(document.querySelectorAll('input[type="search"]')).find(el => !el.closest('[role="banner"]')),
  ],

  messageInput: [
    // ARIA-based (most reliable)
    () => document.querySelector('[aria-label*="Message" i][role="textbox"]'),
    () => document.querySelector('[role="textbox"][contenteditable="true"]'),
    () => document.querySelector('[aria-label*="Type a message" i]'),
    // Fallback: contenteditable divs
    () => document.querySelector('[contenteditable="true"][data-lexical-editor="true"]'),
    () => document.querySelector('[contenteditable="true"]'),
  ],

  conversationList: [
    // Strategy 1: aria-current without aria-label (primary - most reliable currently)
    () => {
      const links = document.querySelectorAll('a[aria-current]:not([aria-label])');
      if (links.length > 0) {
        console.log('[Selectors] Strategy 1 succeeded: a[aria-current]:not([aria-label])');
      }
      return links;
    },

    // Strategy 2: Links with thread ID in URL
    () => {
      const links = document.querySelectorAll('a[href*="/t/"]');
      if (links.length > 0) {
        console.log('[Selectors] Strategy 2 succeeded: a[href*="/t/"]');
      }
      return links;
    },

    // Strategy 3: Find chat container first, then links within it
    () => {
      const chatContainer = document.querySelector('[aria-label*="Chats" i]')
        || document.querySelector('[aria-label*="Chat list" i]')
        || document.querySelector('[aria-label*="conversations" i]');
      if (chatContainer) {
        const links = chatContainer.querySelectorAll('a[aria-current]');
        if (links.length > 0) {
          console.log('[Selectors] Strategy 3 succeeded: container + a[aria-current]');
        }
        return links;
      }
      return [];
    },

    // Strategy 4: Links in a list role container
    () => {
      const listContainer = document.querySelector('[role="list"]');
      if (listContainer) {
        const links = listContainer.querySelectorAll('a');
        if (links.length > 0) {
          console.log('[Selectors] Strategy 4 succeeded: [role="list"] a');
        }
        return links;
      }
      return [];
    },
  ],

  activeConversation: [
    // Currently selected/active conversation - look for aria-current="page"
    () => document.querySelector('a[aria-current="page"]'),
    () => document.querySelector('a[role="link"][aria-current="page"]'),
  ],
};

module.exports = { finder, selectors };
