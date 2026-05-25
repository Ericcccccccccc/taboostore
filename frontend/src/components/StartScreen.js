import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getUILanguage, t } from '../utils/localization';
import './styles.css';

/**
 * StartScreen - Game configuration screen
 * Allows players to set timer duration, pass limit, language mode, and team names
 */
function StartScreen({ onStartGame, initialTeamNames, onClaim }) {
  const [settings, setSettings] = useState({
    timerDuration: 60,
    passLimit: 1,
    language: 'both'
  });

  const uiLang = getUILanguage(settings.language);
  const defaultTeamLabel = t('teamDefaultName', uiLang);

  const [claimCode, setClaimCode] = useState('');
  const [claimError, setClaimError] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    const code = claimCode.trim().toUpperCase();
    if (code.length !== 4) {
      setClaimError(t('claimError', uiLang));
      return;
    }
    setClaimBusy(true);
    setClaimError('');
    try {
      await onClaim(code);
    } catch (err) {
      setClaimError(t('claimError', uiLang));
      setClaimBusy(false);
    }
  };

  // Team names with per-input dirty flags so UI-language changes don't overwrite custom names
  const [teamNames, setTeamNames] = useState(() => {
    if (initialTeamNames && initialTeamNames.length === 2) {
      return [...initialTeamNames];
    }
    return [`${defaultTeamLabel} 1`, `${defaultTeamLabel} 2`];
  });
  const [teamNameDirty, setTeamNameDirty] = useState([
    Boolean(initialTeamNames && initialTeamNames[0]),
    Boolean(initialTeamNames && initialTeamNames[1])
  ]);

  // Re-prefill default team names when language flips, but only for untouched inputs
  useEffect(() => {
    setTeamNames(prev => prev.map((name, i) =>
      teamNameDirty[i] ? name : `${defaultTeamLabel} ${i + 1}`
    ));
  }, [defaultTeamLabel, teamNameDirty]);

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

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTeamNameChange = (idx, value) => {
    setTeamNames(prev => prev.map((n, i) => (i === idx ? value : n)));
    setTeamNameDirty(prev => prev.map((d, i) => (i === idx ? true : d)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (settings.timerDuration > 0) {
      const finalNames = teamNames.map((n, i) =>
        (n && n.trim().length > 0) ? n.trim() : `${defaultTeamLabel} ${i + 1}`
      );
      onStartGame({ ...settings, teamNames: finalNames });
    }
  };

  return (
    <div className="start-screen">
      <h1 className="game-title">{t('gameTitle', uiLang)}</h1>
      <p className="game-subtitle">{t('gameSubtitle', uiLang)}</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="timer">{t('timerDuration', uiLang)}</label>
          <div className="option-buttons no-wrap">
            {timerOptions.map(option => (
              <button
                key={option}
                type="button"
                className={`option-button ${settings.timerDuration === option ? 'active' : ''}`}
                onClick={() => handleChange('timerDuration', option)}
              >
                {option}{t('seconds', uiLang)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="passes">{t('passLimit', uiLang)}</label>
          <div className="option-buttons no-wrap">
            {passOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`option-button ${settings.passLimit === option.value ? 'active' : ''}`}
                onClick={() => handleChange('passLimit', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="language">{t('languageMode', uiLang)}</label>
          <div className="option-buttons">
            {languageOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`option-button ${settings.language === option.value ? 'active' : ''}`}
                onClick={() => handleChange('language', option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('teamNames', uiLang)}</label>
          <div className="team-names-row">
            {[0, 1].map(i => (
              <input
                key={i}
                type="text"
                className="team-name-input"
                maxLength={20}
                value={teamNames[i]}
                onChange={(e) => handleTeamNameChange(i, e.target.value)}
              />
            ))}
          </div>
          <span className="team-name-hint">{t('teamNameHint', uiLang)}</span>
        </div>

        <button type="submit" className="start-button">
          {t('startGame', uiLang)}
        </button>
      </form>

      {onClaim && (
        <form className="claim-form" onSubmit={handleClaimSubmit}>
          <label className="claim-label">{t('enterGameCode', uiLang)}</label>
          <div className="claim-row">
            <input
              type="text"
              className="claim-code-input"
              maxLength={4}
              value={claimCode}
              onChange={(e) => { setClaimCode(e.target.value.toUpperCase()); setClaimError(''); }}
              placeholder="ABCD"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="claim-button"
              disabled={claimBusy || claimCode.trim().length !== 4}
            >
              {t('claim', uiLang)}
            </button>
          </div>
          {claimError && <p className="claim-error">{claimError}</p>}
        </form>
      )}
    </div>
  );
}

StartScreen.propTypes = {
  onStartGame: PropTypes.func.isRequired,
  initialTeamNames: PropTypes.arrayOf(PropTypes.string),
  onClaim: PropTypes.func
};

export default StartScreen;
