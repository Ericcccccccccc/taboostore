import React from 'react';
import PropTypes from 'prop-types';
import { getUILanguage, t } from '../utils/localization';
import './styles.css';

/**
 * EndScreen - Results display screen
 * Shows final score, card list with statuses, and navigation options
 */
function EndScreen({ results, onPlayAgain, onReturnToMenu }) {
  const { score, cards, settings } = results;

  // Get the UI language based on selected language mode
  const uiLang = getUILanguage(settings?.language || 'en');
  const totalCards = score.correct + score.missed + score.passed;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct':
        return '✓';
      case 'missed':
        return '✗';
      case 'passed':
        return '↻';
      default:
        return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'correct':
        return 'card-correct';
      case 'missed':
        return 'card-missed';
      case 'passed':
        return 'card-passed';
      default:
        return '';
    }
  };

  return (
    <div className="end-screen">
      <h1 className="game-over-title">{t('gameOver', uiLang)}</h1>

      <div className="final-score">
        <h2>{t('finalScore', uiLang)}</h2>
        <div className="score-summary">
          <div className="score-stat correct-stat">
            <span className="score-number">{score.correct}</span>
            <span className="score-label">{t('correct', uiLang)}</span>
          </div>
          <div className="score-stat missed-stat">
            <span className="score-number">{score.missed}</span>
            <span className="score-label">{t('missed', uiLang)}</span>
          </div>
          <div className="score-stat passed-stat">
            <span className="score-number">{score.passed}</span>
            <span className="score-label">{t('pass', uiLang)}</span>
          </div>
        </div>
      </div>

      <div className="cards-list-container">
        <h3>{t('cardsPlayed', uiLang)} ({totalCards})</h3>
        <ul className="cards-list">
          {cards.map((card, index) => (
            <li
              key={index}
              className={`card-item ${getStatusClass(card.status)}`}
            >
              <span className="card-status-icon">{getStatusIcon(card.status)}</span>
              <span className="card-word-text">{card.wordToGuess || card.word}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="end-buttons">
        <button
          className="play-again-button"
          onClick={onPlayAgain}
        >
          {t('playAgain', uiLang)}
        </button>
        <button
          className="return-menu-button"
          onClick={onReturnToMenu}
        >
          {t('returnToMenu', uiLang)}
        </button>
      </div>
    </div>
  );
}

EndScreen.propTypes = {
  results: PropTypes.shape({
    score: PropTypes.shape({
      correct: PropTypes.number.isRequired,
      missed: PropTypes.number.isRequired,
      passed: PropTypes.number.isRequired
    }).isRequired,
    cards: PropTypes.arrayOf(
      PropTypes.shape({
        word: PropTypes.string.isRequired,
        status: PropTypes.oneOf(['correct', 'missed', 'passed']).isRequired
      })
    ).isRequired
  }).isRequired,
  onPlayAgain: PropTypes.func.isRequired,
  onReturnToMenu: PropTypes.func.isRequired
};

export default EndScreen;
