// Desktop sizes
export const DESKTOP_WINDOW_WIDTH = 1400;
export const DESKTOP_WINDOW_HEIGHT = 700;
export const DESKTOP_GAME_WIDTH = 400;
export const DESKTOP_CAM_WIDTH = 1000;

// Mobile sizes
export const MOBILE_GAME_WIDTH = 100; // %
export const MOBILE_GAME_HEIGHT = 60; // %
export const MOBILE_CAM_WIDTH = 100; // %
export const MOBILE_CAM_HEIGHT = 40; // %

// Responsive - determined at runtime
export let WINDOW_WIDTH = DESKTOP_WINDOW_WIDTH;
export let WINDOW_HEIGHT = DESKTOP_WINDOW_HEIGHT;
export let GAME_WIDTH = DESKTOP_GAME_WIDTH;
export let GAME_HEIGHT = DESKTOP_WINDOW_HEIGHT;
export let CAM_WIDTH = DESKTOP_CAM_WIDTH;
export let CAM_HEIGHT = DESKTOP_WINDOW_HEIGHT;
export let IS_MOBILE = false;

// Function to update sizes based on window
export function updateResponsiveSizes() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1400;
  const height = typeof window !== 'undefined' ? window.innerHeight : 700;
  
  IS_MOBILE = width < 768;
  
  if (IS_MOBILE) {
    WINDOW_WIDTH = width;
    WINDOW_HEIGHT = height;
    GAME_WIDTH = width;
    GAME_HEIGHT = Math.floor(height * 0.6);
    CAM_WIDTH = width;
    CAM_HEIGHT = Math.floor(height * 0.4);
  } else {
    WINDOW_WIDTH = DESKTOP_WINDOW_WIDTH;
    WINDOW_HEIGHT = DESKTOP_WINDOW_HEIGHT;
    GAME_WIDTH = DESKTOP_GAME_WIDTH;
    CAM_WIDTH = DESKTOP_CAM_WIDTH;
  }
}

export const GRAVITY = 0.1;
export const FLAP_STRENGTH = -3;
export const PIPE_GAP = 220;
export const PIPE_WIDTH = 52;
export const PIPE_SPEED = 2;
export const PIPE_SPAWN_INTERVAL = 6000; // Arttırıldı: 4000 → 6000 (bloklar arasında daha fazla boşluk)
export const GROUND_HEIGHT = 112;
export const RAISE_THRESHOLD = -0.12;

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export const SpeedLevel = {
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD',
} as const;

export type SpeedLevel = (typeof SpeedLevel)[keyof typeof SpeedLevel];

// Speed level configs
export const SPEED_CONFIGS = {
  EASY: {
    gravity: 0.08,
    pipeSpeed: 1.5,
    pipeSpawnInterval: 7000,
  },
  NORMAL: {
    gravity: 0.1,
    pipeSpeed: 2,
    pipeSpawnInterval: 6000,
  },
  HARD: {
    gravity: 0.12,
    pipeSpeed: 2.5,
    pipeSpawnInterval: 5000,
  },
} as const;