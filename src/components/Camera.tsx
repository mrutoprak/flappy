import React, { useRef, useEffect } from 'react';
import { GameState } from '../game/constants';
import type { PoseResult } from '../game/types';

interface CameraProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseResult: PoseResult;
  gameState: GameState;
}

const CONNECTIONS = [
  [11, 12], [11, 13], [13, 15],
  [12, 14], [14, 16]
];

const CAMERA_WIDTH = 160;
const CAMERA_HEIGHT = 120;

export const Camera: React.FC<CameraProps> = ({ videoRef, poseResult, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

        // Draw connections (lines)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        
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

        // Draw keypoints (circles)
        ctx.fillStyle = '#00ff00';
        const radius = 4;
        
        [11, 12, 13, 14, 15, 16].forEach((idx) => {
          const lm = poseResult.landmarks?.[idx];
          if (lm && lm.visibility! > 0.3) {
            ctx.beginPath();
            ctx.arc(w - lm.x * w, lm.y * h, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      id = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
    };
  }, [videoRef, poseResult]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
    }}>
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

      {/* Status text */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: poseResult.elbowRaised ? '#00ff00' : '#aaa',
          fontSize: 11,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px black',
          zIndex: 10,
          padding: '0 5px',
          lineHeight: '1.2',
        }}
      >
        {gameState === GameState.GAME_OVER
          ? (poseResult.elbowRaised ? 'RESTARTING...' : 'Raise elbows')
          : poseResult.elbowRaised
          ? 'ELBOWS UP! 💪'
          : 'Ready'}
      </div>
    </div>
  );
};
