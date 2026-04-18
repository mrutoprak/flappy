import { useState, useEffect, useCallback } from 'react';
import { Game } from './components/Game';
import { Camera } from './components/Camera';
import { usePoseDetection } from './hooks/usePoseDetection';
import { GameState, updateResponsiveSizes, SpeedLevel } from './game/constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [speedLevel, setSpeedLevel] = useState<SpeedLevel>(SpeedLevel.NORMAL);
  const [flapTrigger, setFlapTrigger] = useState(0);
  const { videoRef, error, poseResult } = usePoseDetection();

  const startGame = useCallback((level: SpeedLevel = speedLevel) => {
    setSpeedLevel(level);
    setGameState(GameState.PLAYING);
  }, [speedLevel]);

  const flap = useCallback(() => {
    setFlapTrigger(prev => prev + 1);
  }, []);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      updateResponsiveSizes();
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (poseResult.shouldFlap) {
      if (gameState === GameState.PLAYING) {
        flap();
      } else {
        startGame();
      }
    }
    if (poseResult.restartTrigger > 0 && gameState === GameState.GAME_OVER) {
      startGame();
    }
  }, [poseResult.shouldFlap, poseResult.restartTrigger, gameState, flap, startGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === GameState.PLAYING) {
          flap();
        } else {
          startGame();
        }
      } else if (e.code === 'Escape') {
        setGameState(GameState.MENU);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, flap, startGame]);

  const handleGameOver = useCallback(() => {
    setGameState(GameState.GAME_OVER);
  }, []);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100vh',
        backgroundColor: '#333',
        color: 'white',
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const handleSpeedSelection = useCallback((level: SpeedLevel) => {
    startGame(level);
  }, [startGame]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Game - Full ekran */}
      <div style={{
        width: '100%',
        height: '100%',
        flexShrink: 0,
        backgroundColor: '#70c5ce',
      }}>
        <Game
          gameState={gameState}
          onGameOver={handleGameOver}
          flapTrigger={flapTrigger}
          speedLevel={speedLevel}
        />
      </div>

      {/* Speed Level Selection Menu - MENU state'inde göster */}
      {gameState === GameState.MENU && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 999,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '40px',
            backgroundColor: '#2a2a3e',
            borderRadius: '15px',
            border: '3px solid #00ff00',
          }}>
            <h1 style={{ color: 'white', textAlign: 'center', margin: '0 0 20px 0' }}>
              Select Difficulty
            </h1>
            {[SpeedLevel.EASY, SpeedLevel.NORMAL, SpeedLevel.HARD].map((level) => (
              <button
                key={level}
                onClick={() => handleSpeedSelection(level)}
                style={{
                  padding: '15px 40px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: speedLevel === level ? '#00ff00' : '#444',
                  color: speedLevel === level ? '#000' : '#fff',
                  border: '2px solid #00ff00',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff00';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = speedLevel === level ? '#00ff00' : '#444';
                  e.currentTarget.style.color = speedLevel === level ? '#000' : '#fff';
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Camera - Sabit pozisyon, sol üst köşe */}
      <div style={{
        position: 'fixed',
        top: 15,
        left: 15,
        width: 160,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        border: '3px solid #00ff00',
        zIndex: 1000,
        backgroundColor: '#1a1a2e',
      }}>
        <Camera videoRef={videoRef} poseResult={poseResult} gameState={gameState} />
      </div>
    </div>
  );
}

export default App;