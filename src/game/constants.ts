export const WINDOW_WIDTH = 1400;
export const WINDOW_HEIGHT = 700;
export const GAME_WIDTH = 400;
export const CAM_WIDTH = 1000;

export const GRAVITY = 0.1;
export const FLAP_STRENGTH = -3;
export const PIPE_GAP = 220;
export const PIPE_WIDTH = 52;
export const PIPE_SPEED = 2;
export const PIPE_SPAWN_INTERVAL = 4000;
export const GROUND_HEIGHT = 112;
export const RAISE_THRESHOLD = -0.12;

export const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER',
} as const;

export type GameState = (typeof GameState)[keyof typeof GameState];