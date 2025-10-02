/**
 * SessionStorage utilities for Taboo game state persistence
 * Handles tracking of seen cards to prevent repeats until all cards are shown
 */

const STORAGE_KEY = 'taboo_game_state';

/**
 * Get the current game state from sessionStorage
 * @returns {Object} Game state object
 */
function getGameState() {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
      seenCards: {},
      currentSession: null
    };
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return {
      seenCards: {},
      currentSession: null
    };
  }
}

/**
 * Save the game state to sessionStorage
 * @param {Object} state - Game state object
 */
function saveGameState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error writing to sessionStorage:', error);
  }
}

export const storage = {
  /**
   * Get seen card IDs for a specific language
   * @param {string} language - Language code (e.g., 'en', 'pt')
   * @returns {Array<string>} Array of seen card IDs
   */
  getSeenCards: (language) => {
    const state = getGameState();
    return state.seenCards[language] || [];
  },

  /**
   * Save seen card IDs for a specific language
   * @param {string} language - Language code
   * @param {Array<string>} cardIds - Array of card IDs
   */
  saveSeenCards: (language, cardIds) => {
    const state = getGameState();
    state.seenCards[language] = cardIds;
    state.seenCards.lastUpdated = new Date().toISOString();
    saveGameState(state);
  },

  /**
   * Add a single card ID to the seen list
   * @param {string} language - Language code
   * @param {string} cardId - Card ID to add
   */
  addSeenCard: (language, cardId) => {
    const seenCards = storage.getSeenCards(language);
    if (!seenCards.includes(cardId)) {
      storage.saveSeenCards(language, [...seenCards, cardId]);
    }
  },

  /**
   * Clear all seen cards (reshuffle)
   */
  clearSeenCards: () => {
    const state = getGameState();
    state.seenCards = {};
    saveGameState(state);
  },

  /**
   * Clear seen cards for a specific language
   * @param {string} language - Language code
   */
  clearLanguageSeenCards: (language) => {
    const state = getGameState();
    if (state.seenCards[language]) {
      delete state.seenCards[language];
      saveGameState(state);
    }
  },

  /**
   * Get last shuffle timestamp
   * @returns {string|null} ISO timestamp of last shuffle
   */
  getLastShuffle: () => {
    const state = getGameState();
    return state.seenCards.lastUpdated || null;
  },

  /**
   * Set last shuffle timestamp
   */
  setLastShuffle: () => {
    const state = getGameState();
    state.seenCards.lastUpdated = new Date().toISOString();
    saveGameState(state);
  },

  /**
   * Save current session data
   * @param {Object} sessionData - Session configuration and state
   */
  saveSession: (sessionData) => {
    const state = getGameState();
    state.currentSession = {
      ...sessionData,
      startTime: sessionData.startTime || new Date().toISOString()
    };
    saveGameState(state);
  },

  /**
   * Get current session data
   * @returns {Object|null} Current session data
   */
  getSession: () => {
    const state = getGameState();
    return state.currentSession;
  },

  /**
   * Clear current session
   */
  clearSession: () => {
    const state = getGameState();
    state.currentSession = null;
    saveGameState(state);
  },

  /**
   * Clear all game state
   */
  clearAll: () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
};

export default storage;
