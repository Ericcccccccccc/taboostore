import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * StartScreen - Game configuration screen
 * Allows players to set timer duration, pass limit, and language mode
 */
function StartScreen({ onStartGame }) {
  const [settings, setSettings] = useState({
    timerDuration: 60,
    passLimit: 1,
    language: 'both'
  });

  const timerOptions = [60, 75, 90, 105, 120];
  const passOptions = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 5, label: '5' },
    { value: -1, label: '∞' }
  ];
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'both', label: '50/50' }
  ];

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate settings before submitting
    if (settings.timerDuration > 0) {
      onStartGame(settings);
    }
  };

  return (
    <div className="start-screen">
      <h1 className="game-title">Taboo Store</h1>
      <p className="game-subtitle">Guess the word without saying the forbidden words!</p>

      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="timer">Timer Duration</label>
          <div className="option-buttons">
            {timerOptions.map(option => (
              <button
                key={option}
                type="button"
                className={`option-button ${settings.timerDuration === option ? 'active' : ''}`}
                onClick={() => handleChange('timerDuration', option)}
              >
                {option}s
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="passes">Pass Limit</label>
          <div className="option-buttons">
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
          <label htmlFor="language">Language Mode</label>
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

        <button type="submit" className="start-button">
          Start Game
        </button>
      </form>
    </div>
  );
}

StartScreen.propTypes = {
  onStartGame: PropTypes.func.isRequired
};

export default StartScreen;
