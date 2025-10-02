/**
 * Core game logic functions for Taboo game
 * Handles card selection, language alternation, scoring, and reshuffle logic
 */

/**
 * Select the next card based on language mode and seen cards
 * @param {Array} cards - Array of available cards
 * @param {Array<string>} seenIds - Array of seen card IDs
 * @param {string} language - Current language ('en', 'pt', or '50/50')
 * @param {boolean} isAlternating - Whether to alternate languages in 50/50 mode
 * @returns {Object|null} Selected card or null if no cards available
 */
export function selectNextCard(cards, seenIds, language, isAlternating = false) {
  if (!cards || cards.length === 0) {
    return null;
  }

  // Filter out already seen cards
  const unseenCards = cards.filter(card => !seenIds.includes(card.id));

  // If no unseen cards, return null (caller should handle reshuffle)
  if (unseenCards.length === 0) {
    return null;
  }

  // Randomly select from unseen cards
  const randomIndex = Math.floor(Math.random() * unseenCards.length);
  return unseenCards[randomIndex];
}

/**
 * Check if reshuffle is needed (all cards have been seen)
 * @param {number} totalCards - Total number of available cards
 * @param {number} seenCount - Number of cards seen
 * @returns {boolean} True if reshuffle needed
 */
export function shouldReshuffle(totalCards, seenCount) {
  return totalCards > 0 && seenCount >= totalCards;
}

/**
 * Get the next language for 50/50 mode (alternates between 'en' and 'pt')
 * @param {string} currentLang - Current language ('en' or 'pt')
 * @param {string} mode - Language mode ('en', 'pt', or '50/50')
 * @returns {string} Next language to use
 */
export function getNextLanguage(currentLang, mode) {
  // If not 50/50 mode, always return the same language
  if (mode !== '50/50') {
    return mode;
  }

  // Alternate between English and Portuguese
  if (currentLang === 'en') {
    return 'pt';
  } else if (currentLang === 'pt') {
    return 'en';
  }

  // Default to English if current language is invalid
  return 'en';
}

/**
 * Calculate final score based on game results
 * @param {Object} results - Game results with correct, missed, and passed counts
 * @returns {Object} Calculated scores
 */
export function calculateFinalScore(results) {
  const { correct = 0, missed = 0, passed = 0 } = results;

  const totalCards = correct + missed + passed;
  const points = correct; // 1 point per correct card
  const accuracy = totalCards > 0 ? Math.round((correct / totalCards) * 100) : 0;

  return {
    points,
    correct,
    missed,
    passed,
    totalCards,
    accuracy
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate game settings
 * @param {Object} settings - Game settings object
 * @returns {boolean} True if settings are valid
 */
export function validateSettings(settings) {
  if (!settings) return false;

  const { timerDuration, passLimit, language } = settings;

  // Timer duration should be a positive number
  if (typeof timerDuration !== 'number' || timerDuration <= 0) {
    return false;
  }

  // Pass limit should be -1 (unlimited) or a non-negative number
  if (typeof passLimit !== 'number' || passLimit < -1) {
    return false;
  }

  // Language should be one of the valid options
  const validLanguages = ['en', 'pt', '50/50'];
  if (!validLanguages.includes(language)) {
    return false;
  }

  return true;
}

/**
 * Format time remaining for display (MM:SS or SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (seconds < 0) return '0';

  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  return `${seconds}`;
}

/**
 * Check if pass is allowed based on settings and usage
 * @param {Object} settings - Game settings
 * @param {number} passesUsed - Number of passes already used
 * @returns {boolean} True if pass is allowed
 */
export function canUsePass(settings, passesUsed) {
  if (!settings) return false;

  const { passLimit } = settings;

  // Unlimited passes
  if (passLimit === -1) {
    return true;
  }

  // Check if under limit
  return passesUsed < passLimit;
}

export default {
  selectNextCard,
  shouldReshuffle,
  getNextLanguage,
  calculateFinalScore,
  shuffleArray,
  validateSettings,
  formatTime,
  canUsePass
};
