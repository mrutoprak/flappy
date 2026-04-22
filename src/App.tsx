import { useState, useEffect } from 'react';
import { usePoseDetection } from './hooks/usePoseDetection';
import { useScreenOrientation } from './hooks/useScreenOrientation';
import { Camera } from './components/Camera';
import { ExerciseMode } from './game/constants';

function App() {
  const [exerciseMode, setExerciseMode] = useState<ExerciseMode | null>(null);
  const { videoRef, error, poseResult } = usePoseDetection();
  const screenOrientation = useScreenOrientation();
  const [target, setTarget] = useState<number | null>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetParam = params.get('target');
    const returnUrlParam = params.get('returnUrl');

    if (targetParam) {
      const targetNum = parseInt(targetParam, 10);
      if (!isNaN(targetNum) && targetNum > 0) {
        setTarget(targetNum);
        setReturnUrl(returnUrlParam);
        setExerciseMode(ExerciseMode.PUSHUP);
      }
    }
  }, []);

  const handleComplete = (count: number) => {
    if (returnUrl && target && count >= target) {
      const separator = returnUrl.includes('?') ? '&' : '?';
      const redirectUrl = `${returnUrl}${separator}score=${count}`;
      window.location.href = redirectUrl;
    }
  };

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

  // Mode selection screen - only show if no target in URL
  if (exerciseMode === null && !target) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100vh',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '30px',
          padding: '50px',
          backgroundColor: '#2a2a3e',
          borderRadius: '20px',
          border: '3px solid #00ff00',
          textAlign: 'center',
        }}>
          <h1 style={{ color: '#00ff00', margin: 0, fontSize: '32px' }}>
            Select Exercise Mode
          </h1>
          <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>
            Choose your workout
          </p>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setExerciseMode(ExerciseMode.PUSHUP)}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: '#00ff00',
                color: '#000',
                border: '3px solid #00ff00',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              💪 Push-up
            </button>

            <button
              onClick={() => setExerciseMode(ExerciseMode.PLANK)}
              style={{
                padding: '20px 40px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: '#00ff00',
                color: '#000',
                border: '3px solid #00ff00',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📍 Plank
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exerciseMode) {
    return null;
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Camera - Full screen */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a0a',
      }}>
        <Camera
          videoRef={videoRef}
          poseResult={poseResult}
          exerciseMode={exerciseMode}
          screenOrientation={screenOrientation}
          onModeChange={() => setExerciseMode(null)}
          target={target}
          returnUrl={returnUrl}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}

export default App;