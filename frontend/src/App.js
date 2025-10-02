import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import StartScreen from './components/StartScreen';
import GameScreen from './components/GameScreen';
import EndScreen from './components/EndScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('start');
  const [gameSettings, setGameSettings] = useState(null);
  const [gameResults, setGameResults] = useState(null);
  const [error, setError] = useState(null);

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

  // Screen transition handlers
  const handleStartGame = (settings) => {
    setGameSettings(settings);
    setCurrentScreen('game');
  };

  const handleEndGame = (results) => {
    setGameResults(results);
    setCurrentScreen('end');
  };

  const handleRestartGame = () => {
    setGameSettings(null);
    setGameResults(null);
    setCurrentScreen('start');
  };

  const handleReturnToMenu = () => {
    setGameSettings(null);
    setGameResults(null);
    setCurrentScreen('start');
  };

  // Render screen based on currentScreen state
  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return <StartScreen onStartGame={handleStartGame} />;

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
            results={gameResults}
            onPlayAgain={handleRestartGame}
            onReturnToMenu={handleReturnToMenu}
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
