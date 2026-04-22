import React, { useRef, useEffect, useState } from 'react';
import type { PoseResult, PlankMetrics } from '../game/types';
import type { ScreenOrientation } from '../hooks/useScreenOrientation';
import { ExerciseMode, PLANK_WARNING_INTERVAL } from '../game/constants';
import { usePlankDetection } from '../hooks/usePlankDetection';

interface CameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseResult: PoseResult;
  exerciseMode: ExerciseMode;
  screenOrientation: ScreenOrientation;
  onModeChange: () => void;
  target?: number | null;
  returnUrl?: string | null;
  onComplete?: (count: number) => void;
}

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15],
  [12, 14], [14, 16]
];

const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;

// Create audio context for beep
const createBeep = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
};

export const Camera: React.FC<CameraProps> = ({
  videoRef,
  poseResult,
  exerciseMode,
  screenOrientation,
  onModeChange,
  target,
  returnUrl,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { calculateAngle } = usePlankDetection();
  const [plankMetrics, setPlankMetrics] = useState<PlankMetrics>({
    isStraight: true,
    angle: 0,
    confidence: 0,
    lastWarningTime: 0,
  });
  const [pushupCount, setPushupCount] = useState(0);
  const wasDownRef = useRef(false);
  const targetRef = useRef(target ?? null);
  const returnUrlRef = useRef(returnUrl ?? null);
  const onCompleteRef = useRef(onComplete ?? null);

  useEffect(() => {
    targetRef.current = target ?? null;
  }, [target]);

  useEffect(() => {
    returnUrlRef.current = returnUrl ?? null;
  }, [returnUrl]);

  useEffect(() => {
    onCompleteRef.current = onComplete ?? null;
  }, [onComplete]);

  useEffect(() => {
    if (exerciseMode !== ExerciseMode.PUSHUP || !target) return;

    const isDown = !poseResult.elbowRaised;
    
    if (wasDownRef.current && !isDown && poseResult.shouldFlap) {
      const newCount = pushupCount + 1;
      setPushupCount(newCount);
      createBeep();
      
      if (newCount >= target && returnUrl) {
        setTimeout(() => {
          onCompleteRef.current?.(newCount);
        }, 500);
      }
    }
    
    wasDownRef.current = isDown;
  }, [poseResult.shouldFlap, poseResult.elbowRaised, exerciseMode, target, returnUrl, pushupCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let id: number;
    const draw = () => {
      canvas.width = CAMERA_WIDTH;
      canvas.height = CAMERA_HEIGHT;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -CAMERA_WIDTH, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
      ctx.restore();

      // Draw pose skeleton only if landmarks available
      if (poseResult.landmarks) {
        const w = CAMERA_WIDTH;
        const h = CAMERA_HEIGHT;

        if (exerciseMode === ExerciseMode.PUSHUP) {
          // Push-up mode: Draw upper body connections
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;

          for (const [i, j] of CONNECTIONS) {
            const p1 = poseResult.landmarks[i];
            const p2 = poseResult.landmarks[j];
            if (p1 && p2 && p1.visibility! > 0.3 && p2.visibility! > 0.3) {
              ctx.beginPath();
              ctx.moveTo(w - p1.x * w, p1.y * h);
              ctx.lineTo(w - p2.x * w, p2.y * h);
              ctx.stroke();
            }
          }

          // Draw keypoints
          ctx.fillStyle = '#00ff00';
          const radius = 5;

          [11, 12, 13, 14, 15, 16].forEach((idx) => {
            const lm = poseResult.landmarks?.[idx];
            if (lm && lm.visibility! > 0.3) {
              ctx.beginPath();
              ctx.arc(w - lm.x * w, lm.y * h, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        } else if (exerciseMode === ExerciseMode.PLANK) {
          // Plank mode: Only calculate and draw if landscape
          if (screenOrientation.isLandscape) {
            const metrics = calculateAngle(poseResult.landmarks);
            setPlankMetrics(metrics);

          const rightShoulder = poseResult.landmarks[11];
          const leftShoulder = poseResult.landmarks[12];
          const rightHip = poseResult.landmarks[23];
          const leftHip = poseResult.landmarks[24];
          const rightAnkle = poseResult.landmarks[27];
          const leftAnkle = poseResult.landmarks[28];

          const minVisibility = 0.3;
          if (
            rightShoulder?.visibility &&
            leftShoulder?.visibility &&
            rightHip?.visibility &&
            leftHip?.visibility &&
            rightAnkle?.visibility &&
            leftAnkle?.visibility &&
            rightShoulder.visibility > minVisibility &&
            leftShoulder.visibility > minVisibility &&
            rightHip.visibility > minVisibility &&
            leftHip.visibility > minVisibility &&
            rightAnkle.visibility > minVisibility &&
            leftAnkle.visibility > minVisibility
          ) {
            // Calculate centers
            const shoulderCenter = {
              x: (rightShoulder.x + leftShoulder.x) / 2,
              y: (rightShoulder.y + leftShoulder.y) / 2,
            };

            const hipCenter = {
              x: (rightHip.x + leftHip.x) / 2,
              y: (rightHip.y + leftHip.y) / 2,
            };

            const ankleCenter = {
              x: (rightAnkle.x + leftAnkle.x) / 2,
              y: (rightAnkle.y + leftAnkle.y) / 2,
            };

            // Draw the plank line
            const lineColor = metrics.isStraight ? '#00ff00' : '#ff0000';
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.moveTo(w - shoulderCenter.x * w, shoulderCenter.y * h);
            ctx.lineTo(w - hipCenter.x * w, hipCenter.y * h);
            ctx.lineTo(w - ankleCenter.x * w, ankleCenter.y * h);
            ctx.stroke();

            // Draw keypoints
            ctx.fillStyle = lineColor;
            const radius = 6;

            [shoulderCenter, hipCenter, ankleCenter].forEach((point) => {
              ctx.beginPath();
              ctx.arc(w - point.x * w, point.y * h, radius, 0, Math.PI * 2);
              ctx.fill();
            });

            // Trigger sound warning if needed
            if (
              !metrics.isStraight &&
              Date.now() - metrics.lastWarningTime > PLANK_WARNING_INTERVAL
            ) {
              createBeep();
            }
          }
          } else {
            // Portrait mode - reset metrics
            setPlankMetrics({
              isStraight: true,
              angle: 0,
              confidence: 0,
              lastWarningTime: 0,
            });
          }
        }
      }

      id = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
    };
  }, [videoRef, poseResult, exerciseMode, screenOrientation, calculateAngle]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0a0a0a',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: 'none',
        }}
      />
      <canvas
        ref={canvasRef}
        width={CAMERA_WIDTH}
        height={CAMERA_HEIGHT}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          flex: 1,
        }}
      />

      {/* Mode Badge */}
      <div
        style={{
          position: 'absolute',
          top: 15,
          left: 15,
          backgroundColor: exerciseMode === ExerciseMode.PUSHUP ? '#0066ff' : '#ff6600',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: '14px',
          zIndex: 10,
        }}
      >
        {exerciseMode === ExerciseMode.PUSHUP ? '💪 PUSH-UP MODE' : '📍 PLANK MODE'}
      </div>

      {/* Plank Metrics Display */}
      {exerciseMode === ExerciseMode.PLANK && screenOrientation.isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: plankMetrics.isStraight ? '#00ff00' : '#ff0000',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            zIndex: 10,
            border: `2px solid ${plankMetrics.isStraight ? '#00ff00' : '#ff0000'}`,
          }}
        >
          <div>Angle: {plankMetrics.angle.toFixed(1)}°</div>
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            {plankMetrics.isStraight ? '✓ Perfect Form!' : '✗ Bend Detected!'}
          </div>
        </div>
      )}

      {exerciseMode === ExerciseMode.PUSHUP && (
        <>
          {target && (
            <div
              style={{
                position: 'absolute',
                top: 70,
                left: 15,
                backgroundColor: pushupCount >= target ? '#00ff00' : 'rgba(0, 0, 0, 0.7)',
                color: pushupCount >= target ? '#000' : '#fff',
                padding: '12px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '18px',
                zIndex: 10,
                border: `2px solid ${pushupCount >= target ? '#00ff00' : '#fff'}`,
              }}
            >
              <div>Hedef: {target}</div>
              <div style={{ fontSize: '24px', color: pushupCount >= target ? '#000' : '#00ff00' }}>
                ✅ {pushupCount} / {target}
              </div>
              {pushupCount >= target && (
                <div style={{ fontSize: '14px', marginTop: '4px' }}>Tamamlandı!</div>
              )}
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              left: 0,
              right: 0,
              textAlign: 'center',
              color: poseResult.elbowRaised ? '#00ff00' : '#aaa',
              fontSize: 16,
              fontWeight: 'bold',
              textShadow: '1px 1px 2px black',
              zIndex: 10,
            }}
          >
            {poseResult.elbowRaised ? '💪 ELBOWS UP - PUSH!' : 'Lower elbows for push-up'}
          </div>
        </>
      )}

      {/* Landscape Warning Overlay - Plank Mode */}
      {exerciseMode === ExerciseMode.PLANK && !screenOrientation.isLandscape && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '80px', animation: 'spin 2s linear infinite' }}>
              📱
            </div>
            <h2 style={{ color: '#ff6600', margin: '0 0 10px 0', fontSize: '24px' }}>
              📱 Telefonu Yatay Tut
            </h2>
            <p style={{ color: '#aaa', margin: 0, fontSize: '14px', maxWidth: '300px' }}>
              Plank pozisyonu doğru ölçüm için telefonun yatay tutulması gerekiyor.
            </p>
            <div
              style={{
                marginTop: '20px',
                width: '40px',
                height: '40px',
                border: '4px solid #ff6600',
                borderRadius: '50%',
                borderTop: '4px solid transparent',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>

          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onModeChange}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          padding: '10px 20px',
          backgroundColor: '#ff0000',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10,
          fontSize: '14px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#cc0000';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ff0000';
        }}
      >
        ← Back
      </button>
    </div>
  );
};
