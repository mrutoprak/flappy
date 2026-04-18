import { useState, useEffect, useCallback } from 'react';
import { Game } from './components/Game';
import { Camera } from './components/Camera';
import { usePoseDetection } from './hooks/usePoseDetection';
import { GameState, updateResponsiveSizes } from './game/constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [flapTrigger, setFlapTrigger] = useState(0);
  const { videoRef, error, poseResult } = usePoseDetection();

  const startGame = useCallback(() => {
    setGameState(GameState.PLAYING);
  }, []);

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
        />
      </div>

      {/* Camera - Sabit pozisyon, sağ alt köşe */}
      <div style={{
        position: 'fixed',
        bottom: 15,
        right: 15,
        width: 320,
        height: 240,
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