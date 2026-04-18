import { useState, useEffect, useCallback } from 'react';
import { Game } from './components/Game';
import { Camera } from './components/Camera';
import { usePoseDetection } from './hooks/usePoseDetection';
import { GameState, WINDOW_WIDTH, WINDOW_HEIGHT, GAME_WIDTH, CAM_WIDTH } from './game/constants';

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
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        backgroundColor: '#333',
        color: 'white',
      }}>
        <div>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      width: WINDOW_WIDTH,
      height: WINDOW_HEIGHT,
      backgroundColor: '#1a1a2e',
    }}>
      <div style={{ width: GAME_WIDTH, height: WINDOW_HEIGHT, flexShrink: 0, backgroundColor: '#70c5ce' }}>
        <Game
          gameState={gameState}
          onGameOver={handleGameOver}
          flapTrigger={flapTrigger}
        />
      </div>
      <div style={{ width: CAM_WIDTH, height: WINDOW_HEIGHT, flexShrink: 0 }}>
        <Camera videoRef={videoRef} poseResult={poseResult} gameState={gameState} />
      </div>
    </div>
  );
}

export default App;