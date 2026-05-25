/**
 * Localization utilities for English and Portuguese
 */

const translations = {
  en: {
    // Start Screen
    gameTitle: 'Taboo',
    gameSubtitle: "The Americas' favorite party game",
    timerDuration: 'Timer Duration',
    passLimit: 'Pass Limit',
    languageMode: 'Language Mode',
    english: 'En 🇺🇸',
    portuguese: 'Pt 🇧🇷',
    both: '50/50',
    startGame: 'Start Game',
    seconds: 's',
    unlimited: '∞',
    teamNames: 'Team Names',
    teamDefaultName: 'Team',
    teamNameHint: 'Tap a name above to edit it',

    // Ready Screen
    ready: 'Ready',
    go: 'Go',
    switchTeam: 'Switch Team',
    back: 'Back',

    // Game Screen
    time: 'Time:',
    correct: 'Correct',
    missed: 'Missed',
    pass: 'Pass',
    loadingCards: 'Loading cards...',
    preparingGame: 'Preparing game...',
    exitGame: 'Exit Game',
    pause: 'Pause',
    resume: 'Resume',
    endGame: 'End Game',
    endGameConfirm: 'Are you sure you want to end the game?',
    cancel: 'Cancel',
    confirm: 'Confirm',

    // End Screen
    gameOver: 'Game Over!',
    timesUp: "Time's Up!",
    finalScore: 'Final Score',
    totalScore: 'Total Score',
    cardsPlayed: 'Cards Played',
    playAgain: 'Play Again',
    returnToMenu: 'Return to Menu',
    reportProblem: 'Report a problem with this card',
    undo: 'Undo',
    problemReported: 'Problem reported for this card',
    round: 'Round',
    teamTotal: 'Total',
    changeResult: 'Change Result',
    originally: 'Originally',
    switchTeamForRound: 'Move round to other team',
    switchScoreConfirm: "Switch this round's score to the other team?",
    switchScore: 'Switch Score',
    changeSettings: 'Change Settings',
    handoff: 'Hand off to another phone',
    handoffCodePrompt: "Enter this code on the other phone's Start screen",
    handoffExpires: 'Other phone has 30 minutes to claim',
    handoffWaiting: 'Waiting for other phone…',
    handoffClaimed: 'Game handed off to the other phone',
    enterGameCode: 'Have a game code?',
    claim: 'Claim',
    claimError: 'Code not found or already claimed',
    returnConfirmPrompt: 'Return to menu? All scores will be discarded.',
    returnConfirmDiscard: 'Discard & return',
    rounds: 'rounds',
    round_one: 'round',
  },

  pt: {
    // Start Screen
    gameTitle: 'Tabu',
    gameSubtitle: 'O jogo de festa favorito das Américas',
    timerDuration: 'Duração do Cronômetro',
    passLimit: 'Limite de Passes',
    languageMode: 'Modo de Idioma',
    english: 'En 🇺🇸',
    portuguese: 'Pt 🇧🇷',
    both: '50/50',
    startGame: 'Iniciar Jogo',
    seconds: 's',
    unlimited: '∞',
    teamNames: 'Nomes dos Times',
    teamDefaultName: 'Time',
    teamNameHint: 'Toque em um nome acima para editá-lo',

    // Ready Screen
    ready: 'Pronto',
    go: 'Vai',
    switchTeam: 'Trocar Time',
    back: 'Voltar',

    // Game Screen
    time: 'Tempo:',
    correct: 'Correto',
    missed: 'Errado',
    pass: 'Passar',
    loadingCards: 'Carregando cartas...',
    preparingGame: 'Preparando jogo...',
    exitGame: 'Sair do Jogo',
    pause: 'Pausar',
    resume: 'Continuar',
    endGame: 'Terminar Jogo',
    endGameConfirm: 'Tem certeza que deseja terminar o jogo?',
    cancel: 'Cancelar',
    confirm: 'Confirmar',

    // End Screen
    gameOver: 'Fim de Jogo!',
    timesUp: 'Acabou o Tempo!',
    finalScore: 'Pontuação Final',
    totalScore: 'Pontuação Total',
    cardsPlayed: 'Cartas Jogadas',
    playAgain: 'Jogar Novamente',
    returnToMenu: 'Voltar ao Menu',
    reportProblem: 'Reportar um problema com esta carta',
    undo: 'Desfazer',
    problemReported: 'Problema reportado para esta carta',
    round: 'Rodada',
    teamTotal: 'Total',
    changeResult: 'Mudar Resultado',
    originally: 'Originalmente',
    switchTeamForRound: 'Mover rodada para o outro time',
    switchScoreConfirm: 'Trocar a pontuação desta rodada para o outro time?',
    switchScore: 'Trocar Pontuação',
    changeSettings: 'Mudar Configurações',
    handoff: 'Passar para outro celular',
    handoffCodePrompt: 'Digite este código na tela inicial do outro celular',
    handoffExpires: 'O outro celular tem 30 minutos para reivindicar',
    handoffWaiting: 'Aguardando o outro celular…',
    handoffClaimed: 'Jogo passado para o outro celular',
    enterGameCode: 'Tem um código de jogo?',
    claim: 'Reivindicar',
    claimError: 'Código não encontrado ou já reivindicado',
    returnConfirmPrompt: 'Voltar ao menu? Todas as pontuações serão descartadas.',
    returnConfirmDiscard: 'Descartar e voltar',
    rounds: 'rodadas',
    round_one: 'rodada',
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