import React, { useRef, useEffect, useState } from 'react';
import { CAM_WIDTH, WINDOW_HEIGHT, GameState } from '../game/constants';
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

export const Camera: React.FC<CameraProps> = ({ videoRef, poseResult, gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ width: CAM_WIDTH, height: WINDOW_HEIGHT });

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle responsive canvas size
    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      if (width > 0 && height > 0) {
        setContainerSize({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    let id: number;
    const draw = () => {
      canvas.width = containerSize.width;
      canvas.height = containerSize.height;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -containerSize.width, 0, containerSize.width, containerSize.height);
      ctx.restore();

      // Draw pose skeleton only if landmarks available
      if (poseResult.landmarks) {
        const w = containerSize.width;
        const h = containerSize.height;

        // Draw connections (lines)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5; // Kalınlığı azalttık
        
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
        const radius = 4; // Daha küçük circles
        
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
      window.removeEventListener('resize', handleResize);
    };
    draw();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, poseResult, containerSize]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          display: 'none',
          width: '100%',
          height: '100%',
        }}
      />
      <canvas
        ref={canvasRef}
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
          bottom: isMobile ? 10 : 30,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: poseResult.elbowRaised ? '#00ff00' : 'white',
          fontSize: isMobile ? 12 : 20,
          fontWeight: 'bold',
          textShadow: '1px 1px 2px black',
          zIndex: 10,
          padding: '0 10px',
        }}
      >
        {gameState === GameState.GAME_OVER
          ? (poseResult.elbowRaised ? 'RESTARTING...' : 'Raise elbows to restart')
          : poseResult.elbowRaised
          ? 'ELBOWS UP! 💪'
          : 'Raise your elbows!'}
      </div>
    </div>
  );
};