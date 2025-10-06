/**
 * Localization utilities for English and Portuguese
 */

const translations = {
  en: {
    // Start Screen
    gameTitle: 'Taboo',
    gameSubtitle: 'Guess the word without saying the forbidden words!',
    timerDuration: 'Timer Duration',
    passLimit: 'Pass Limit',
    languageMode: 'Language Mode',
    english: 'English',
    portuguese: 'Portuguese',
    both: '50/50',
    startGame: 'Start Game',
    seconds: 's',

    // Game Screen
    time: 'Time:',
    correct: 'Correct',
    missed: 'Missed',
    pass: 'Pass',
    loadingCards: 'Loading cards...',
    preparingGame: 'Preparing game...',
    exitGame: 'Exit Game',

    // End Screen
    gameOver: 'Game Over!',
    finalScore: 'Final Score',
    cardsPlayed: 'Cards Played',
    playAgain: 'Play Again',
    returnToMenu: 'Return to Menu',
  },

  pt: {
    // Start Screen
    gameTitle: 'Tabu',
    gameSubtitle: 'Adivinhe a palavra sem dizer as palavras proibidas!',
    timerDuration: 'Duração do Cronômetro',
    passLimit: 'Limite de Passes',
    languageMode: 'Modo de Idioma',
    english: 'Inglês',
    portuguese: 'Português',
    both: '50/50',
    startGame: 'Iniciar Jogo',
    seconds: 's',

    // Game Screen
    time: 'Tempo:',
    correct: 'Correto',
    missed: 'Errado',
    pass: 'Passar',
    loadingCards: 'Carregando cartas...',
    preparingGame: 'Preparando jogo...',
    exitGame: 'Sair do Jogo',

    // End Screen
    gameOver: 'Fim de Jogo!',
    finalScore: 'Pontuação Final',
    cardsPlayed: 'Cartas Jogadas',
    playAgain: 'Jogar Novamente',
    returnToMenu: 'Voltar ao Menu',
  }
};

/**
 * Get the appropriate language based on the selected language mode
 * @param {string} languageMode - The selected language mode ('en', 'pt', 'both')
 * @returns {string} The language code to use for UI ('en' or 'pt')
 */
export function getUILanguage(languageMode) {
  // If Portuguese is selected, use Portuguese for UI
  if (languageMode === 'pt') {
    return 'pt';
  }
  // For English and 50/50 mode, use English UI
  return 'en';
}

/**
 * Get a translation string
 * @param {string} key - The translation key
 * @param {string} lang - The language code ('en' or 'pt')
 * @returns {string} The translated string
 */
export function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations['en'][key] || key;
}

/**
 * Get all translations for a language
 * @param {string} lang - The language code ('en' or 'pt')
 * @returns {Object} All translations for the language
 */
export function getTranslations(lang = 'en') {
  return translations[lang] || translations['en'];
}

export default {
  getUILanguage,
  t,
  getTranslations,
  translations
};