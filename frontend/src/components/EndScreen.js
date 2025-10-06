import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getUILanguage, t } from '../utils/localization';
import { api } from '../api/client';
import './styles.css';

/**
 * EndScreen - Results display screen
 * Shows final score, card list with statuses, and navigation options
 */
function EndScreen({ results, onPlayAgain, onReturnToMenu }) {
  const { score, cards, settings } = results;
  const [selectedCard, setSelectedCard] = useState(null);
  const [reportedCards, setReportedCards] = useState(new Set());

  // Get the UI language based on selected language mode
  const uiLang = getUILanguage(settings?.language || 'en');
  const totalCards = score.correct + score.missed + score.passed;
  const totalScore = score.correct - score.missed; // +1 for correct, -1 for missed

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

  const handleCardClick = (card) => {
    setSelectedCard(selectedCard === card ? null : card);
  };

  const handleReportProblem = async (card) => {
    try {
      // Call API to report the problem
      await api.reportProblemCard(card.wordToGuess);
      setReportedCards(new Set([...reportedCards, card.wordToGuess]));
    } catch (error) {
      console.error('Failed to report problem:', error);
    }
  };

  return (
    <div className="end-screen">
      <h1 className="game-over-title">{t('gameOver', uiLang)}</h1>

      <div className="final-score">
        <h2>{t('finalScore', uiLang)}</h2>
        <div className="total-score">
          <span className="total-score-label">{t('totalScore', uiLang)}:</span>
          <span className={`total-score-value ${totalScore > 0 ? 'positive' : totalScore < 0 ? 'negative' : 'neutral'}`}>
            {totalScore > 0 ? '+' : ''}{totalScore}
          </span>
        </div>
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
              className={`card-item ${getStatusClass(card.status)} ${selectedCard === card ? 'selected' : ''}`}
              onClick={() => handleCardClick(card)}
            >
              <div className="card-item-header">
                <span className="card-status-icon">{getStatusIcon(card.status)}</span>
                <span className="card-word-text">{card.wordToGuess || card.word}</span>
              </div>
              {selectedCard === card && card.forbiddenWords && (
                <div className="card-details">
                  <div className="forbidden-words-list">
                    {card.forbiddenWords.map((word, idx) => (
                      <span key={idx} className="forbidden-word-item">{word}</span>
                    ))}
                  </div>
                  {!reportedCards.has(card.wordToGuess) ? (
                    <button
                      className="report-problem-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportProblem(card);
                      }}
                    >
                      🚩 {t('reportProblem', uiLang)}
                    </button>
                  ) : (
                    <span className="problem-reported">✓ {t('problemReported', uiLang)}</span>
                  )}
                </div>
              )}
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
