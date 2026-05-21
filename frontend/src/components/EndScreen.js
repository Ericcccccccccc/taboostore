import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getUILanguage, t } from '../utils/localization';
import { api } from '../api/client';
import './styles.css';

/**
 * EndScreen - Results display screen
 * Shows the just-finished round's score, team-by-team round history,
 * action buttons, and the cards-played list with an inline "Change Result" editor.
 */
function EndScreen({
  rounds,
  teamNames,
  settings,
  onPlayAgain,
  onReturnToMenu,
  onChangeCardStatus,
  onSwitchRoundTeam,
  onUpdateSettings,
  handoffCode,
  handoffClaimed,
  onCreateHandoff,
  onHandoffClaimed,
  onCloseHandoffModal
}) {
  const uiLang = getUILanguage(settings?.language || 'en');
  const [selectedKey, setSelectedKey] = useState(null);     // `${roundIdx}:${cardIdx}` of expanded row
  const [changingKey, setChangingKey] = useState(null);     // same key, but with picker visible
  const [reportedCards, setReportedCards] = useState(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [switchConfirmIdx, setSwitchConfirmIdx] = useState(null);

  // Poll handoff status while modal is open
  useEffect(() => {
    if (!handoffCode || handoffClaimed) return undefined;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const status = await api.handoffStatus(handoffCode);
        if (!cancelled && status.claimed) {
          onHandoffClaimed();
        }
      } catch (err) {
        // swallow; transient
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [handoffCode, handoffClaimed, onHandoffClaimed]);

  const timerOptions = [60, 75, 90, 120];
  const passOptions = [
    { value: 1, label: '1' },
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: -1, label: t('unlimited', uiLang) }
  ];
  const languageOptions = [
    { value: 'en', label: t('english', uiLang) },
    { value: 'pt', label: t('portuguese', uiLang) },
    { value: 'both', label: t('both', uiLang) }
  ];

  if (!rounds || rounds.length === 0) {
    return (
      <div className="end-screen">
        <h1 className="game-over-title">{t('timesUp', uiLang)}</h1>
        <div className="end-buttons">
          <button className="return-menu-button" onClick={onReturnToMenu}>
            {t('returnToMenu', uiLang)}
          </button>
        </div>
      </div>
    );
  }

  const lastRoundIdx = rounds.length - 1;
  const lastRound = rounds[lastRoundIdx];
  const lastScore = lastRound.score;
  const lastTotalCards = lastScore.correct + lastScore.missed + lastScore.passed;
  const lastNetScore = lastScore.correct - lastScore.missed;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'correct': return '✓';
      case 'missed':  return '✗';
      case 'passed':  return '↻';
      default:        return '';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'correct': return 'card-correct';
      case 'missed':  return 'card-missed';
      case 'passed':  return 'card-passed';
      default:        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'correct': return t('correct', uiLang);
      case 'missed':  return t('missed', uiLang);
      case 'passed':  return t('pass', uiLang);
      default:        return '';
    }
  };

  const keyFor = (roundIdx, cardIdx) => `${roundIdx}:${cardIdx}`;

  const handleCardClick = (roundIdx, cardIdx) => {
    const k = keyFor(roundIdx, cardIdx);
    if (selectedKey === k) {
      setSelectedKey(null);
      setChangingKey(null);
    } else {
      setSelectedKey(k);
      setChangingKey(null);
    }
  };

  const handleReportProblem = async (card) => {
    try {
      await api.reportProblemCard(card.wordToGuess);
      setReportedCards(new Set([...reportedCards, card.wordToGuess]));
    } catch (err) {
      console.error('Failed to report problem:', err);
    }
  };

  const handleChangeResult = (roundIdx, cardIdx, newStatus) => {
    onChangeCardStatus(roundIdx, cardIdx, newStatus);
    setChangingKey(null);
  };

  // Build per-team round listing
  const teamBlocks = [0, 1].map(teamIdx => {
    const teamRounds = rounds
      .map((r, idx) => ({ round: r, idx }))
      .filter(({ round }) => round.team === teamIdx);

    const totals = teamRounds.reduce(
      (acc, { round }) => {
        acc.correct += round.score.correct;
        acc.missed  += round.score.missed;
        acc.passed  += round.score.passed;
        return acc;
      },
      { correct: 0, missed: 0, passed: 0 }
    );
    const net = totals.correct - totals.missed;

    return { teamIdx, teamRounds, totals, net };
  });

  return (
    <div className="end-screen">
      <h1 className="game-over-title">{t('timesUp', uiLang)}</h1>

      <div className="final-score">
        <h2>{t('finalScore', uiLang)}</h2>
        <div className="total-score">
          <span className="total-score-label">{t('totalScore', uiLang)}:</span>
          <span className={`total-score-value ${lastNetScore > 0 ? 'positive' : lastNetScore < 0 ? 'negative' : 'neutral'}`}>
            {lastNetScore > 0 ? '+' : ''}{lastNetScore}
          </span>
        </div>
        <div className="score-summary">
          <div className="score-stat correct-stat">
            <span className="score-number">{lastScore.correct}</span>
            <span className="score-label">{t('correct', uiLang)}</span>
          </div>
          <div className="score-stat missed-stat">
            <span className="score-number">{lastScore.missed}</span>
            <span className="score-label">{t('missed', uiLang)}</span>
          </div>
          <div className="score-stat passed-stat">
            <span className="score-number">{lastScore.passed}</span>
            <span className="score-label">{t('pass', uiLang)}</span>
          </div>
        </div>
      </div>

      {teamBlocks.map(({ teamIdx, teamRounds, totals, net }) => (
        <div key={teamIdx} className="team-history">
          <h3>{teamNames[teamIdx]}</h3>
          {teamRounds.length === 0 ? (
            <div className="round-row">
              <span className="round-row-label">—</span>
            </div>
          ) : (
            teamRounds.map(({ round, idx }, displayIdx) => {
              const roundNet = round.score.correct - round.score.missed;
              const netClass = roundNet > 0 ? 'positive' : roundNet < 0 ? 'negative' : 'neutral';
              return (
                <div key={idx} className="round-row">
                  <span className="round-row-label">
                    {t('round', uiLang)} {displayIdx + 1}
                  </span>
                  <span className="round-row-stats">
                    <span className="stat-correct">✓ {round.score.correct}</span>
                    <span className="stat-missed">✗ {round.score.missed}</span>
                    <span className="stat-passed">↻ {round.score.passed}</span>
                  </span>
                  <span className={`round-row-net ${netClass}`}>
                    {roundNet > 0 ? '+' : ''}{roundNet}
                  </span>
                  <div className="round-row-actions">
                    {idx === rounds.length - 1 && (
                      <button
                        className="switch-round-team-btn"
                        onClick={() => setSwitchConfirmIdx(idx)}
                        title={t('switchTeamForRound', uiLang)}
                        aria-label={t('switchTeamForRound', uiLang)}
                      >
                        ⇄
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div className="round-row team-total-row">
            <span className="round-row-label">{t('teamTotal', uiLang)}</span>
            <span className="round-row-stats">
              <span className="stat-correct">✓ {totals.correct}</span>
              <span className="stat-missed">✗ {totals.missed}</span>
              <span className="stat-passed">↻ {totals.passed}</span>
            </span>
            <span className={`round-row-net ${net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral'}`}>
              {net > 0 ? '+' : ''}{net}
            </span>
          </div>
        </div>
      ))}

      <div className="end-secondary-buttons">
        <button
          className="change-settings-toggle"
          onClick={() => setShowSettings(s => !s)}
          disabled={handoffClaimed}
        >
          ⚙ {t('changeSettings', uiLang)}
        </button>
        <button
          className="handoff-toggle"
          onClick={onCreateHandoff}
          disabled={handoffClaimed}
        >
          📲 {t('handoff', uiLang)}
        </button>
      </div>

      {showSettings && settings && (
        <div className="settings-panel">
          <div className="form-group">
            <label>{t('timerDuration', uiLang)}</label>
            <div className="option-buttons no-wrap">
              {timerOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  className={`option-button ${settings.timerDuration === opt ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ timerDuration: opt })}
                >
                  {opt}{t('seconds', uiLang)}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>{t('passLimit', uiLang)}</label>
            <div className="option-buttons no-wrap">
              {passOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`option-button ${settings.passLimit === opt.value ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ passLimit: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>{t('languageMode', uiLang)}</label>
            <div className="option-buttons">
              {languageOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`option-button ${settings.language === opt.value ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ language: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="end-buttons">
        <button className="play-again-button" onClick={onPlayAgain} disabled={handoffClaimed}>
          {t('playAgain', uiLang)}
        </button>
        <button
          className="return-menu-button"
          onClick={() => handoffClaimed ? onReturnToMenu(false) : setShowReturnDialog(true)}
        >
          {t('returnToMenu', uiLang)}
        </button>
      </div>

      {showReturnDialog && (
        <div className="confirm-dialog-overlay" onClick={() => setShowReturnDialog(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{t('saveScoresPrompt', uiLang)}</p>
            <div className="confirm-buttons confirm-buttons-stack">
              <button
                className="confirm-button play-again-button"
                onClick={() => { setShowReturnDialog(false); onReturnToMenu(true); }}
              >
                {t('saveScores', uiLang)}
              </button>
              <button
                className="confirm-button confirm-end-button"
                onClick={() => { setShowReturnDialog(false); onReturnToMenu(false); }}
              >
                {t('discardScores', uiLang)}
              </button>
              <button
                className="confirm-button cancel-button"
                onClick={() => setShowReturnDialog(false)}
              >
                {t('cancel', uiLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {switchConfirmIdx !== null && (
        <div className="confirm-dialog-overlay" onClick={() => setSwitchConfirmIdx(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="confirm-message">{t('switchScoreConfirm', uiLang)}</p>
            <div className="confirm-buttons">
              <button
                className="confirm-button cancel-button"
                onClick={() => setSwitchConfirmIdx(null)}
              >
                {t('cancel', uiLang)}
              </button>
              <button
                className="confirm-button confirm-switch-button"
                onClick={() => {
                  onSwitchRoundTeam(switchConfirmIdx);
                  setSwitchConfirmIdx(null);
                }}
              >
                {t('switchScore', uiLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {handoffCode && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog handoff-dialog">
            {!handoffClaimed ? (
              <>
                <p className="handoff-prompt">{t('handoffCodePrompt', uiLang)}</p>
                <div className="handoff-code">{handoffCode}</div>
                <p className="handoff-expires">{t('handoffExpires', uiLang)}</p>
                <p className="handoff-waiting">{t('handoffWaiting', uiLang)}</p>
                <button
                  className="confirm-button cancel-button"
                  onClick={onCloseHandoffModal}
                >
                  {t('cancel', uiLang)}
                </button>
              </>
            ) : (
              <>
                <p className="handoff-claimed-icon">✅</p>
                <p className="handoff-prompt">{t('handoffClaimed', uiLang)}</p>
                <button
                  className="confirm-button return-menu-button"
                  onClick={() => { onCloseHandoffModal(); onReturnToMenu(false); }}
                >
                  {t('returnToMenu', uiLang)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="cards-list-container">
        <h3>{t('cardsPlayed', uiLang)} ({lastTotalCards})</h3>
        <ul className="cards-list">
          {lastRound.cards.map((card, cardIdx) => {
            const k = keyFor(lastRoundIdx, cardIdx);
            const isSelected = selectedKey === k;
            const isChanging = changingKey === k;
            const originalStatus = card.originalStatus || card.status;

            return (
              <li
                key={cardIdx}
                className={`card-item ${getStatusClass(card.status)} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleCardClick(lastRoundIdx, cardIdx)}
              >
                <div className="card-item-header">
                  <span className="card-status-icon">{getStatusIcon(card.status)}</span>
                  <span className="card-word-text">{card.wordToGuess || card.word}</span>
                </div>
                {isSelected && (
                  <div className="card-details">
                    {card.forbiddenWords && (
                      <div className="forbidden-words-list">
                        {card.forbiddenWords.map((word, idx) => (
                          <span key={idx} className="forbidden-word-item">{word}</span>
                        ))}
                      </div>
                    )}

                    {!isChanging ? (
                      <div className="card-actions-row">
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
                          <span className="problem-reported">
                            ✓ {t('problemReported', uiLang)}
                          </span>
                        )}
                        <button
                          className="change-result-trigger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChangingKey(k);
                          }}
                        >
                          {t('changeResult', uiLang)}
                        </button>
                      </div>
                    ) : (
                      <div
                        className="change-result-picker"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="change-result-original">
                          {t('originally', uiLang)}: {getStatusLabel(originalStatus)}
                        </span>
                        <button
                          className="change-correct"
                          onClick={() => handleChangeResult(lastRoundIdx, cardIdx, 'correct')}
                          title={t('correct', uiLang)}
                        >
                          ✓
                        </button>
                        <button
                          className="change-missed"
                          onClick={() => handleChangeResult(lastRoundIdx, cardIdx, 'missed')}
                          title={t('missed', uiLang)}
                        >
                          ✗
                        </button>
                        <button
                          className="change-passed"
                          onClick={() => handleChangeResult(lastRoundIdx, cardIdx, 'passed')}
                          title={t('pass', uiLang)}
                        >
                          ↻
                        </button>
                        <button
                          className="change-cancel"
                          onClick={() => setChangingKey(null)}
                        >
                          {t('cancel', uiLang)}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

EndScreen.propTypes = {
  rounds: PropTypes.arrayOf(
    PropTypes.shape({
      team: PropTypes.number.isRequired,
      score: PropTypes.shape({
        correct: PropTypes.number.isRequired,
        missed: PropTypes.number.isRequired,
        passed: PropTypes.number.isRequired
      }).isRequired,
      cards: PropTypes.array.isRequired
    })
  ).isRequired,
  teamNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  settings: PropTypes.object,
  onPlayAgain: PropTypes.func.isRequired,
  onReturnToMenu: PropTypes.func.isRequired,
  onChangeCardStatus: PropTypes.func.isRequired,
  onSwitchRoundTeam: PropTypes.func.isRequired,
  onUpdateSettings: PropTypes.func.isRequired,
  handoffCode: PropTypes.string,
  handoffClaimed: PropTypes.bool,
  onCreateHandoff: PropTypes.func.isRequired,
  onHandoffClaimed: PropTypes.func.isRequired,
  onCloseHandoffModal: PropTypes.func.isRequired
};

export default EndScreen;
