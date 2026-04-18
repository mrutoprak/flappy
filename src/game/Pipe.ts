import { PIPE_SPEED, PIPE_WIDTH, GAME_WIDTH } from './constants';
import type { PipeState } from './types';

export class Pipe {
  x: number;
  gapY: number;
  passed: boolean;
  pipeSpeed: number;

  constructor(gapY: number, pipeSpeed: number = PIPE_SPEED) {
    this.x = GAME_WIDTH + 50;
    this.gapY = gapY;
    this.passed = false;
    this.pipeSpeed = pipeSpeed;
  }

  update(): void {
    this.x -= this.pipeSpeed;
  }

  checkPassed(birdX: number): boolean {
    if (!this.passed && this.x + PIPE_WIDTH * 2 < birdX) {
      this.passed = true;
      return true;
    }
    return false;
  }

  isOffscreen(): boolean {
    return this.x < -PIPE_WIDTH * 2;
  }

  getState(): PipeState {
    return {
      x: this.x,
      gapY: this.gapY,
      passed: this.passed,
    };
  }

  static fromState(state: PipeState): Pipe {
    const pipe = new Pipe(state.gapY);
    pipe.x = state.x;
    pipe.passed = state.passed;
    return pipe;
  }
}