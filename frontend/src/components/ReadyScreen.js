import React from 'react';
import PropTypes from 'prop-types';
import { t } from '../utils/localization';
import './styles.css';

/**
 * ReadyScreen - Shown between rounds.
 * "<Team Name> Ready" + Go / Switch Team / Back buttons.
 */
function ReadyScreen({ teamName, uiLang, onGo, onSwitchTeam, onBack }) {
  return (
    <div className="ready-screen">
      <h1 className="ready-title">{teamName} {t('ready', uiLang)}</h1>
      <div className="ready-buttons">
        <button className="ready-go-button" onClick={onGo}>
          {t('go', uiLang)}
        </button>
        <button className="ready-switch-button" onClick={onSwitchTeam}>
          {t('switchTeam', uiLang)}
        </button>
        <button className="ready-back-button" onClick={onBack}>
          {t('back', uiLang)}
        </button>
      </div>
    </div>
  );
}

ReadyScreen.propTypes = {
  teamName: PropTypes.string.isRequired,
  uiLang: PropTypes.string.isRequired,
  onGo: PropTypes.func.isRequired,
  onSwitchTeam: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};

export default ReadyScreen;
