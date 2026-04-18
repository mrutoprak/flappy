import { GameState } from './constants';

export interface BirdState {
  x: number;
  y: number;
  velocity: number;
  frameIndex: number;
  animationTimer: number;
}

export interface PipeState {
  x: number;
  gapY: number;
  passed: boolean;
}

export interface GameStore {
  state: GameState;
  bird: BirdState;
  pipes: PipeState[];
  score: number;
  lastPipeTime: number;
  groundScroll: number;
}

export interface PoseResult {
  elbowRaised: boolean; // Elbow-based detection
  shouldFlap: boolean;
  restartTrigger: number;
  landmarks?: readonly {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }[];
}

export interface PlankMetrics {
  isStraight: boolean;
  angle: number;
  confidence: number;
  lastWarningTime: number;
}