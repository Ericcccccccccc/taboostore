import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * EndScreen - Results display screen
 * Shows final score, card list with statuses, and navigation options
 */
function EndScreen({ results, onPlayAgain, onReturnToMenu }) {
  const { score, cards } = results;
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
      <h1 className="game-over-title">Game Over!</h1>

      <div className="final-score">
        <h2>Final Score</h2>
        <div className="score-summary">
          <div className="score-stat correct-stat">
            <span className="score-number">{score.correct}</span>
            <span className="score-label">Correct</span>
          </div>
          <div className="score-stat missed-stat">
            <span className="score-number">{score.missed}</span>
            <span className="score-label">Missed</span>
          </div>
          <div className="score-stat passed-stat">
            <span className="score-number">{score.passed}</span>
            <span className="score-label">Passed</span>
          </div>
        </div>
      </div>

      <div className="cards-list-container">
        <h3>Cards Played ({totalCards})</h3>
        <ul className="cards-list">
          {cards.map((card, index) => (
            <li
              key={index}
              className={`card-item ${getStatusClass(card.status)}`}
            >
              <span className="card-status-icon">{getStatusIcon(card.status)}</span>
              <span className="card-word-text">{card.word}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="end-buttons">
        <button
          className="play-again-button"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
        <button
          className="return-menu-button"
          onClick={onReturnToMenu}
        >
          Return to Menu
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
