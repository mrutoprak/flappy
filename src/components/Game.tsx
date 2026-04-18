import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  WINDOW_HEIGHT,
  GAME_WIDTH,
  PIPE_GAP,
  PIPE_WIDTH,
  PIPE_SPAWN_INTERVAL,
  GROUND_HEIGHT,
  PIPE_SPEED,
  GameState,
} from '../game/constants';
import { Bird } from '../game/Bird';
import { Pipe } from '../game/Pipe';

interface GameProps {
  gameState: GameState;
  onGameOver: () => void;
  flapTrigger: number;
}

export const Game: React.FC<GameProps> = ({ gameState, onGameOver, flapTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdRef = useRef<Bird>(new Bird());
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const lastPipeTimeRef = useRef(0);
  const groundScrollRef = useRef(0);
  const frameCountRef = useRef(0);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const loadedRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: GAME_WIDTH, height: WINDOW_HEIGHT });

  const loadImages = useCallback(() => {
    const paths = [
      'yellowbird-downflap.png',
      'yellowbird-midflap.png', 
      'yellowbird-upflap.png',
      'pipe-green.png',
      'background-day.png',
      'base.png',
      'gameover.png',
      'message.png',
      ...Array.from({ length: 10 }, (_, i) => `${i}.png`),
    ];

    let loaded = 0;
    paths.forEach((path) => {
      const img = new Image();
      img.onload = () => {
        loaded++;
        if (loaded === paths.length) loadedRef.current = true;
      };
      img.onerror = () => {
        loaded++;
      };
      img.src = `/assets/${path}`;
      imagesRef.current.set(path.replace('.png', ''), img);
    });
  }, []);

  const gameSizeRef = useRef({ width: canvasSize.width, height: canvasSize.height });

  // Update game size ref when canvas size changes
  useEffect(() => {
    gameSizeRef.current = canvasSize;
  }, [canvasSize]);

  const spawnPipe = useCallback(() => {
    const { height } = gameSizeRef.current;
    const minY = 150;
    const maxY = height - GROUND_HEIGHT - 150;
    const gapY = minY + Math.random() * (maxY - minY);
    pipesRef.current.push(new Pipe(gapY));
  }, []);

  const resetGame = useCallback(() => {
    const { width, height } = gameSizeRef.current;
    birdRef.current = new Bird(width / 3, height / 2 - 50);
    pipesRef.current = [];
    scoreRef.current = 0;
    lastPipeTimeRef.current = Date.now();
    groundScrollRef.current = 0;
    frameCountRef.current = 0;
  }, []);

  const checkCollision = useCallback((): boolean => {
    const { height } = gameSizeRef.current;
    const bird = birdRef.current;
    const birdRadius = 12;
    const birdLeft = bird.x - birdRadius;
    const birdRight = bird.x + birdRadius;
    const birdTop = bird.y - birdRadius;
    const birdBottom = bird.y + birdRadius;

    if (birdTop < 0 || birdBottom > height - GROUND_HEIGHT - 10) return true;

    for (const pipe of pipesRef.current) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH * 2;
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < gapTop || birdBottom > gapBottom) return true;
      }
    }
    return false;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = gameSizeRef.current;
    const images = imagesRef.current;

    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, width, height);

    const bg = images.get('background-day');
    if (bg) ctx.drawImage(bg, 0, 0, width, height);

    const pipeImg = images.get('pipe-green');
    pipesRef.current.forEach((pipe) => {
      const gapTop = pipe.gapY - PIPE_GAP / 2;
      const gapBottom = pipe.gapY + PIPE_GAP / 2;
      const pipeH = 320;

      if (pipeImg) {
        ctx.drawImage(pipeImg, pipe.x, gapTop - pipeH, PIPE_WIDTH * 2, pipeH);
        ctx.drawImage(pipeImg, pipe.x, gapBottom, PIPE_WIDTH * 2, pipeH);
      }
    });

    const groundImg = images.get('base');
    if (groundImg) {
      const scroll = groundScrollRef.current % 24;
      ctx.drawImage(groundImg, -scroll, height - GROUND_HEIGHT, width * 2, GROUND_HEIGHT);
    }

    const bird = birdRef.current;
    const frames = ['yellowbird-downflap', 'yellowbird-midflap', 'yellowbird-upflap'];
    const birdImg = images.get(frames[bird.frameIndex]);
    if (birdImg) {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      const rot = Math.max(-25, Math.min(-bird.velocity * 3, 70));
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(birdImg, -24, -24, 48, 48);
      ctx.restore();
    }

    if (gameState === GameState.PLAYING) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(scoreRef.current.toString(), width / 2, 70);
    }

    if (gameState === GameState.MENU) {
      const msg = images.get('message');
      if (msg) {
        ctx.drawImage(msg, width / 2 - 87, height / 2 - 60, 174, 120);
      }
    }

    if (gameState === GameState.GAME_OVER) {
      const go = images.get('gameover');
      if (go) ctx.drawImage(go, width / 2 - 96, height / 3 - 30, 192, 60);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(scoreRef.current.toString(), width / 2, height / 3 + 60);
    }
  }, [gameState]);

  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    birdRef.current.update();

    const now = Date.now();
    if (now - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
      spawnPipe();
      lastPipeTimeRef.current = now;
    }

    pipesRef.current.forEach((pipe) => {
      pipe.update();
      if (!pipe.passed && pipe.x + PIPE_WIDTH * 2 < birdRef.current.x) {
        pipe.passed = true;
        scoreRef.current += 1;
      }
    });

    pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_WIDTH * 2);
    groundScrollRef.current = (groundScrollRef.current + PIPE_SPEED) % 24;

    if (checkCollision()) onGameOver();
  }, [gameState, spawnPipe, checkCollision, onGameOver]);

  useEffect(() => {
    if (gameState === GameState.PLAYING) resetGame();
  }, [gameState, resetGame]);

  useEffect(() => {
    if (flapTrigger > 0 && gameState === GameState.PLAYING) {
      birdRef.current.flap();
    }
  }, [flapTrigger, gameState]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle responsive canvas size - GET PARENT SIZE
  useEffect(() => {
    const handleCanvasResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      if (width > 0 && height > 0) {
        setCanvasSize({ width, height });
        console.log(`Canvas resized to: ${width}x${height}`);
      }
    };

    // Initial call
    handleCanvasResize();

    // Listen for resize
    window.addEventListener('resize', handleCanvasResize);
    
    // Also observe parent element size changes
    const resizeObserver = new ResizeObserver(() => {
      handleCanvasResize();
    });
    
    const parent = canvasRef.current?.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    return () => {
      window.removeEventListener('resize', handleCanvasResize);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let frameId: number;
    const loop = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && loadedRef.current) {
        update();
        draw(ctx);
      }
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [update, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
};