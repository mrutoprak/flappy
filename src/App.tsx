import { useState, useEffect, useCallback } from 'react';
import { Game } from './components/Game';
import { Camera } from './components/Camera';
import { usePoseDetection } from './hooks/usePoseDetection';
import { GameState, WINDOW_WIDTH, WINDOW_HEIGHT, GAME_WIDTH, CAM_WIDTH, updateResponsiveSizes } from './game/constants';

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [flapTrigger, setFlapTrigger] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
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
      setWindowSize({
        width: typeof window !== 'undefined' ? window.innerWidth : WINDOW_WIDTH,
        height: typeof window !== 'undefined' ? window.innerHeight : WINDOW_HEIGHT,
      });
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

  const isMobile = windowSize.width < 768;

  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '100%',
          height: '60%',
          flexShrink: 0,
          backgroundColor: '#70c5ce',
          borderBottom: '2px solid #333',
        }}>
          <Game
            gameState={gameState}
            onGameOver={handleGameOver}
            flapTrigger={flapTrigger}
          />
        </div>
        <div style={{
          width: '100%',
          height: '40%',
          flexShrink: 0,
          backgroundColor: '#1a1a2e',
          overflow: 'hidden',
        }}>
          <Camera videoRef={videoRef} poseResult={poseResult} gameState={gameState} />
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      overflow: 'hidden',
    }}>
      <div style={{
        width: GAME_WIDTH,
        height: '100%',
        flexShrink: 0,
        backgroundColor: '#70c5ce',
        borderRight: '2px solid #333',
      }}>
        <Game
          gameState={gameState}
          onGameOver={handleGameOver}
          flapTrigger={flapTrigger}
        />
      </div>
      <div style={{
        width: CAM_WIDTH,
        height: '100%',
        flexShrink: 0,
        backgroundColor: '#1a1a2e',
      }}>
        <Camera videoRef={videoRef} poseResult={poseResult} gameState={gameState} />
      </div>
    </div>
  );
}

export default App;