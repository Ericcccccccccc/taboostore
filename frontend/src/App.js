import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import StartScreen from './components/StartScreen';
import ReadyScreen from './components/ReadyScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';
import { getUILanguage } from './utils/localization';

function App() {
  const [currentScreen, setCurrentScreen] = useState('start');
  const [gameSettings, setGameSettings] = useState(null);
  const [teamNames, setTeamNames] = useState(['Team 1', 'Team 2']);
  const [rounds, setRounds] = useState([]);
  const [currentTeamIdx, setCurrentTeamIdx] = useState(0);
  const [error, setError] = useState(null);
  const [handoffCode, setHandoffCode] = useState(null);     // string when modal visible
  const [handoffClaimed, setHandoffClaimed] = useState(false);

  // Check API health on mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await api.checkHealth();
        console.log('API Health Check:', health);
      } catch (err) {
        console.error('API Health Check Failed:', err);
        setError('Unable to connect to backend API');
      }
    };

    checkApiHealth();
  }, []);

  const handleStartGame = (settings) => {
    const names = (settings.teamNames && settings.teamNames.length === 2)
      ? settings.teamNames
      : ['Team 1', 'Team 2'];
    setGameSettings(settings);
    setTeamNames(names);
    setRounds([]);
    setCurrentTeamIdx(0);
    setCurrentScreen('ready');
  };

  const handleReadyGo = () => {
    setCurrentScreen('game');
  };

  const handleReadySwitchTeam = () => {
    setCurrentTeamIdx(i => 1 - i);
  };

  const handleReadyBack = () => {
    if (rounds.length > 0) {
      // Came from End (via Play Again or Continue-preserved-game). Back to End
      // keeps team names, rounds, settings, and currentTeamIdx intact.
      setCurrentScreen('end');
    } else {
      // First-ever Ready (entered from Start). No game data to preserve.
      setCurrentScreen('start');
    }
  };

  const handleEndGame = (results) => {
    setRounds(prev => [
      ...prev,
      {
        team: currentTeamIdx,
        score: results.score,
        cards: results.cards
      }
    ]);
    setCurrentScreen('end');
  };

  const handlePlayAgain = () => {
    setCurrentTeamIdx(i => 1 - i);
    setCurrentScreen('ready');
  };

  const handleReturnToMenu = () => {
    setRounds([]);
    setGameSettings(null);
    setTeamNames(['Team 1', 'Team 2']);
    setCurrentTeamIdx(0);
    setCurrentScreen('start');
  };

  const handleCreateHandoff = async () => {
    try {
      const resp = await api.createHandoff({
        teamNames,
        rounds,
        currentTeamIdx,
        gameSettings,
      });
      setHandoffCode(resp.code);
      setHandoffClaimed(false);
    } catch (err) {
      console.error('Failed to create handoff:', err);
      setError('Could not create handoff. Try again.');
    }
  };

  const handleHandoffClaimed = () => {
    setHandoffClaimed(true);
  };

  const handleCloseHandoffModal = () => {
    setHandoffCode(null);
    setHandoffClaimed(false);
  };

  const handleClaim = async (code) => {
    const resp = await api.claimHandoff(code);
    setTeamNames(resp.teamNames);
    setRounds(resp.rounds);
    setCurrentTeamIdx(resp.currentTeamIdx);
    setGameSettings(resp.gameSettings);
    // Land on End screen so the claimer sees the team history they took over.
    setCurrentScreen('end');
  };

  const handleUpdateSettings = (patch) => {
    setGameSettings(prev => ({ ...prev, ...patch }));
  };

  const handleSwitchRoundTeam = (roundIdx) => {
    setRounds(prev => prev.map((r, i) =>
      i === roundIdx ? { ...r, team: 1 - r.team } : r
    ));
  };

  const handleCardStatusChange = (roundIdx, cardIdx, newStatus) => {
    setRounds(prev => prev.map((r, i) => {
      if (i !== roundIdx) return r;
      const newCards = r.cards.map((c, j) =>
        j === cardIdx ? { ...c, status: newStatus } : c
      );
      const score = newCards.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, { correct: 0, missed: 0, passed: 0 });
      return { ...r, cards: newCards, score };
    }));
  };

  const uiLang = gameSettings ? getUILanguage(gameSettings.language) : 'en';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return (
          <StartScreen
            onStartGame={handleStartGame}
            initialTeamNames={teamNames}
            onClaim={handleClaim}
          />
        );

      case 'ready':
        return (
          <ReadyScreen
            teamName={teamNames[currentTeamIdx]}
            uiLang={uiLang}
            onGo={handleReadyGo}
            onSwitchTeam={handleReadySwitchTeam}
            onBack={handleReadyBack}
          />
        );

      case 'game':
        return (
          <GameScreen
            settings={gameSettings}
            onEndGame={handleEndGame}
          />
        );

      case 'end':
        return (
          <EndScreen
            rounds={rounds}
            teamNames={teamNames}
            settings={gameSettings}
            onPlayAgain={handlePlayAgain}
            onReturnToMenu={handleReturnToMenu}
            onChangeCardStatus={handleCardStatusChange}
            onSwitchRoundTeam={handleSwitchRoundTeam}
            onUpdateSettings={handleUpdateSettings}
            handoffCode={handoffCode}
            handoffClaimed={handoffClaimed}
            onCreateHandoff={handleCreateHandoff}
            onHandoffClaimed={handleHandoffClaimed}
            onCloseHandoffModal={handleCloseHandoffModal}
          />
        );

      default:
        return <div>Unknown screen</div>;
    }
  };

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}
      {renderScreen()}
    </div>
  );
}

export default App;
