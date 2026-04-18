import { usePoseDetection } from './hooks/usePoseDetection';
import { Camera } from './components/Camera';

function App() {
  const { videoRef, error, poseResult } = usePoseDetection();

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
        <Camera videoRef={videoRef} poseResult={poseResult} />
      </div>
    </div>
  );
}

export default App;