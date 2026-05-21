import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import { useTimer } from '../hooks/useTimer';
import { useCards } from '../hooks/useCards';
import { canUsePass, formatTime } from '../utils/gameLogic';
import { getUILanguage, t } from '../utils/localization';
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
  const [isPaused, setIsPaused] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [undoCard, setUndoCard] = useState(null);
  const [pendingNext, setPendingNext] = useState(null);
  const [displayCard, setDisplayCard] = useState(null);
  const wordRowRef = useRef(null);
  const [isHeaderTall, setIsHeaderTall] = useState(false);

  // Get the UI language based on selected language mode
  const uiLang = getUILanguage(settings.language);

  // Timer hook
  const { timeRemaining, isRunning, start: startTimer, pause: pauseTimer, resume: resumeTimer } = useTimer(
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

  // Load first card and start timer once cards finish loading.
  // hasStartedRef guards against the effect re-firing when nextCard's
  // useCallback identity changes (it changes every card in 'both' mode
  // because nextCard internally calls setCurrentLanguage).
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (!loading && !error && !hasStartedRef.current) {
      hasStartedRef.current = true;
      nextCard();
      startTimer();
    }
  }, [loading, error, nextCard, startTimer]);

  // Update display card when current card changes
  useEffect(() => {
    if (currentCard) {
      setDisplayCard(currentCard);
    }
  }, [currentCard]);

  // Detect when the top header row (word + flags) wraps to more than one line.
  // Triggers a CSS modifier that squishes only the top half — the
  // forbidden-words section stays at its generous spacing.
  useLayoutEffect(() => {
    const el = wordRowRef.current;
    if (!el || !displayCard) {
      setIsHeaderTall(false);
      return undefined;
    }
    const measure = () => {
      const word = el.querySelector('.card-word');
      if (!word) return;
      const fontSize = parseFloat(getComputedStyle(word).fontSize);
      const lineHeight = parseFloat(getComputedStyle(word).lineHeight) || fontSize * 1.15;
      setIsHeaderTall(el.offsetHeight > lineHeight * 1.4);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    let cancelled = false;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (!cancelled) measure(); });
    }
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [displayCard?.wordToGuess, settings.language]);

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      resumeTimer();
    } else {
      setIsPaused(true);
      pauseTimer();
    }
  };

  const handleEndGame = () => {
    setShowEndConfirm(true);
    pauseTimer();
  };

  const confirmEndGame = () => {
    const results = {
      score,
      cards: cardHistory,
      settings
    };
    onEndGame(results);
  };

  const cancelEndGame = () => {
    setShowEndConfirm(false);
    if (!isPaused) {
      resumeTimer();
    }
  };

  // If undo stashed a pendingNext card (the one the user already saw before
  // pressing undo), restore it instead of pulling a fresh random card.
  const advanceCard = () => {
    if (pendingNext) {
      setDisplayCard(pendingNext);
      setPendingNext(null);
    } else {
      nextCard();
    }
  };

  const handleCorrect = () => {
    if (displayCard && !isPaused && !showEndConfirm) {
      setUndoCard(displayCard);
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      setCardHistory(prev => [...prev, {
        ...displayCard,
        status: 'correct',
        originalStatus: 'correct'
      }]);
      advanceCard();
    }
  };

  const handleMissed = () => {
    if (displayCard && !isPaused && !showEndConfirm) {
      setUndoCard(displayCard);
      setScore(prev => ({ ...prev, missed: prev.missed + 1 }));
      setCardHistory(prev => [...prev, {
        ...displayCard,
        status: 'missed',
        originalStatus: 'missed'
      }]);
      advanceCard();
    }
  };

  const handlePass = () => {
    if (displayCard && canUsePass(settings, passesUsed) && !isPaused && !showEndConfirm) {
      setUndoCard(displayCard);
      setScore(prev => ({ ...prev, passed: prev.passed + 1 }));
      setPassesUsed(prev => prev + 1);
      setCardHistory(prev => [...prev, {
        ...displayCard,
        status: 'passed',
        originalStatus: 'passed'
      }]);
      advanceCard();
    }
  };

  const handleUndo = () => {
    if (cardHistory.length > 0 && undoCard && !isPaused && !showEndConfirm) {
      const lastCard = cardHistory[cardHistory.length - 1];

      // Stash the card the user was about to see again, so re-deciding the
      // restored card brings it back instead of picking a fresh random card.
      setPendingNext(currentCard);

      setDisplayCard(undoCard);
      setUndoCard(null);
      setCardHistory(prev => prev.slice(0, -1));

      if (lastCard.status === 'correct') {
        setScore(prev => ({ ...prev, correct: prev.correct - 1 }));
      } else if (lastCard.status === 'missed') {
        setScore(prev => ({ ...prev, missed: prev.missed - 1 }));
      } else if (lastCard.status === 'passed') {
        setScore(prev => ({ ...prev, passed: prev.passed - 1 }));
        setPassesUsed(prev => prev - 1);
      }
    }
  };

  const passAllowed = canUsePass(settings, passesUsed);
  const passButtonText = settings.passLimit === -1
    ? `${t('pass', uiLang)} (${passesUsed})`
    : `${t('pass', uiLang)} (${passesUsed}/${settings.passLimit})`;

  // Show loading state
  if (loading) {
    return (
      <div className="game-screen">
        <div className="loading-message">{t('loadingCards', uiLang)}</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="game-screen">
        <div className="error-message">{error}</div>
        <button onClick={() => onEndGame({ score, cards: cardHistory, settings })}>
          {t('exitGame', uiLang)}
        </button>
      </div>
    );
  }

  // Show waiting state if no card loaded yet
  if (!displayCard) {
    return (
      <div className="game-screen">
        <div className="loading-message">{t('preparingGame', uiLang)}</div>
      </div>
    );
  }

  return (
    <div className={`game-screen ${isPaused || showEndConfirm ? 'game-paused' : ''}`}>
      <div className="game-controls">
        <div className="timer-display">
          <span className="timer-label">{t('time', uiLang)}</span>
          <span className="timer-value">{formatTime(timeRemaining)}</span>
        </div>
        <div className="control-buttons">
          <button
            className={`control-button pause-button ${isPaused ? 'active' : ''}`}
            onClick={handlePause}
            disabled={showEndConfirm}
          >
            {isPaused ? '▶ ' + t('resume', uiLang) : '⏸ ' + t('pause', uiLang)}
          </button>
          <button
            className="control-button end-button"
            onClick={handleEndGame}
            disabled={showEndConfirm}
          >
            ⏹ {t('endGame', uiLang)}
          </button>
        </div>
      </div>

      <div className="game-content">
        <div className={`card-display ${isHeaderTall ? 'card-display--header-tall' : ''}`}>
          {settings.language === 'both' && (
            <>
              <span className="card-flag card-flag--left" aria-hidden="true">
                {displayCard.language === 'en' ? '🇺🇸' : '🇧🇷'}
              </span>
              <span className="card-flag card-flag--right" aria-hidden="true">
                {displayCard.language === 'en' ? '🇺🇸' : '🇧🇷'}
              </span>
            </>
          )}
          <div className="card-word-row" ref={wordRowRef}>
            <h2 className="card-word">{displayCard.wordToGuess}</h2>
          </div>
          <div className="card-divider"></div>
          <ul className="forbidden-words">
            {displayCard.forbiddenWords && displayCard.forbiddenWords.map((word, index) => (
              <li key={index}>{word}</li>
            ))}
          </ul>
        </div>

        <div className="action-buttons">
          <button
            className="action-button correct-button"
            onClick={handleCorrect}
            disabled={isPaused || showEndConfirm}
          >
            ✓ {t('correct', uiLang)}
          </button>
          <button
            className="action-button missed-button"
            onClick={handleMissed}
            disabled={isPaused || showEndConfirm}
          >
            ✗ {t('missed', uiLang)}
          </button>
        </div>

        <div className="secondary-buttons">
          <button
            className="action-button pass-button"
            onClick={handlePass}
            disabled={!passAllowed || isPaused || showEndConfirm}
          >
            ↻ {passButtonText}
          </button>
          <button
            className="action-button undo-button"
            onClick={handleUndo}
            disabled={cardHistory.length === 0 || isPaused || showEndConfirm}
          >
            ⟲ {t('undo', uiLang)}
          </button>
        </div>

        <div className="score-display">
          <span className="score-item correct-score">{score.correct} ✓</span>
          <span className="score-item missed-score">{score.missed} ✗</span>
          <span className="score-item passed-score">{score.passed} ↻</span>
        </div>
      </div>

      {showEndConfirm && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <p className="confirm-message">{t('endGameConfirm', uiLang)}</p>
            <div className="confirm-buttons">
              <button
                className="confirm-button cancel-button"
                onClick={cancelEndGame}
              >
                {t('cancel', uiLang)}
              </button>
              <button
                className="confirm-button confirm-end-button"
                onClick={confirmEndGame}
              >
                {t('confirm', uiLang)}
              </button>
            </div>
          </div>
        </div>
      )}
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
