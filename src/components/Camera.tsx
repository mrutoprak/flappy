import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let id: number;
    const draw = () => {
      canvas.width = CAM_WIDTH;
      canvas.height = WINDOW_HEIGHT;

      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -CAM_WIDTH, 0, CAM_WIDTH, WINDOW_HEIGHT);
      ctx.restore();

      if (poseResult.landmarks) {
        const w = CAM_WIDTH;
        const h = WINDOW_HEIGHT;

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#00ff00';

        for (const [i, j] of CONNECTIONS) {
          const p1 = poseResult.landmarks[i];
          const p2 = poseResult.landmarks[j];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(w - p1.x * w, p1.y * h);
            ctx.lineTo(w - p2.x * w, p2.y * h);
            ctx.stroke();
          }
        }

        [11, 12, 13, 14, 15, 16].forEach((idx) => {
          const lm = poseResult.landmarks?.[idx];
          if (lm) {
            ctx.beginPath();
            ctx.arc(w - lm.x * w, lm.y * h, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, [videoRef, poseResult]);

  return (
    <div style={{ width: CAM_WIDTH, height: WINDOW_HEIGHT, position: 'relative' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute',
        top: 30,
        left: 50,
        width: 60,
        height: 80,
        borderRadius: 10,
        border: '3px solid white',
        backgroundColor: poseResult.leftRaised ? 'rgba(0,255,0,0.5)' : 'rgba(80,80,80,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
      }}>L</div>

      <div style={{
        position: 'absolute',
        top: 30,
        right: 50,
        width: 60,
        height: 80,
        borderRadius: 10,
        border: '3px solid white',
        backgroundColor: poseResult.rightRaised ? 'rgba(0,255,0,0.5)' : 'rgba(80,80,80,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
      }}>R</div>

      <div style={{
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: poseResult.leftRaised || poseResult.rightRaised ? '#00ff00' : 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textShadow: '1px 1px 2px black',
      }}>
        {gameState === GameState.GAME_OVER
          ? (poseResult.leftRaised || poseResult.rightRaised ? 'RESTARTING...' : 'ONE arm to restart')
          : poseResult.leftRaised && poseResult.rightRaised
          ? 'BOTH ARMS UP!'
          : poseResult.leftRaised
          ? 'LEFT ARM UP!'
          : poseResult.rightRaised
          ? 'RIGHT ARM UP!'
          : 'Raise your arms!'}
      </div>
    </div>
  );
};