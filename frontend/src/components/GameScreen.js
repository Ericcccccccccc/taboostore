import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTimer } from '../hooks/useTimer';
import { useCards } from '../hooks/useCards';
import { canUsePass, formatTime } from '../utils/gameLogic';
import './styles.css';

/**
 * GameScreen - Active gameplay screen
 * Displays current card, timer, score, and action buttons
 */
function GameScreen({ settings, onEndGame }) {
  const [score, setScore] = useState({
    correct: 0,
    missed: 0,
    passed: 0
  });
  const [passesUsed, setPassesUsed] = useState(0);
  const [cardHistory, setCardHistory] = useState([]);

  // Timer hook
  const { timeRemaining, isRunning, start: startTimer } = useTimer(
    settings.timerDuration,
    handleTimeUp
  );

  // Cards hook
  const { currentCard, loading, error, nextCard } = useCards(settings);

  // Handle timer completion
  function handleTimeUp() {
    const results = {
      score,
      cards: cardHistory,
      settings
    };
    onEndGame(results);
  }

  // Load first card and start timer on mount
  useEffect(() => {
    if (!loading && !error) {
      nextCard();
      startTimer();
    }
  }, [loading, error, nextCard, startTimer]);

  const handleCorrect = () => {
    if (currentCard) {
      // Update score
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));

      // Add to history
      setCardHistory(prev => [...prev, { ...currentCard, status: 'correct' }]);

      // Load next card
      nextCard();
    }
  };

  const handleMissed = () => {
    if (currentCard) {
      // Update score
      setScore(prev => ({ ...prev, missed: prev.missed + 1 }));

      // Add to history
      setCardHistory(prev => [...prev, { ...currentCard, status: 'missed' }]);

      // Load next card
      nextCard();
    }
  };

  const handlePass = () => {
    if (currentCard && canUsePass(settings, passesUsed)) {
      // Update score
      setScore(prev => ({ ...prev, passed: prev.passed + 1 }));
      setPassesUsed(prev => prev + 1);

      // Add to history
      setCardHistory(prev => [...prev, { ...currentCard, status: 'passed' }]);

      // Load next card
      nextCard();
    }
  };

  const passAllowed = canUsePass(settings, passesUsed);
  const passButtonText = settings.passLimit === -1
    ? `Pass (${passesUsed})`
    : `Pass (${passesUsed}/${settings.passLimit})`;

  // Show loading state
  if (loading) {
    return (
      <div className="game-screen">
        <div className="loading-message">Loading cards...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="game-screen">
        <div className="error-message">{error}</div>
        <button onClick={() => onEndGame({ score, cards: cardHistory, settings })}>
          Exit Game
        </button>
      </div>
    );
  }

  // Show waiting state if no card loaded yet
  if (!currentCard) {
    return (
      <div className="game-screen">
        <div className="loading-message">Preparing game...</div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      <div className="timer-display">
        <span className="timer-label">Time:</span>
        <span className="timer-value">{formatTime(timeRemaining)}</span>
      </div>

      <div className="card-display">
        <h2 className="card-word">{currentCard.wordToGuess}</h2>
        <div className="card-divider"></div>
        <ul className="forbidden-words">
          {currentCard.forbiddenWords && currentCard.forbiddenWords.map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ul>
      </div>

      <div className="action-buttons">
        <button
          className="action-button correct-button"
          onClick={handleCorrect}
        >
          ✓ Correct
        </button>
        <button
          className="action-button missed-button"
          onClick={handleMissed}
        >
          ✗ Missed
        </button>
      </div>

      <div className="pass-button-container">
        <button
          className="action-button pass-button"
          onClick={handlePass}
          disabled={!passAllowed}
        >
          ↻ {passButtonText}
        </button>
      </div>

      <div className="score-display">
        <span className="score-item correct-score">{score.correct} ✓</span>
        <span className="score-item missed-score">{score.missed} ✗</span>
        <span className="score-item passed-score">{score.passed} ↻</span>
      </div>
    </div>
  );
}

GameScreen.propTypes = {
  settings: PropTypes.shape({
    timerDuration: PropTypes.number.isRequired,
    passLimit: PropTypes.number.isRequired,
    language: PropTypes.string.isRequired
  }).isRequired,
  onEndGame: PropTypes.func.isRequired
};

export default GameScreen;
