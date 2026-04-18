import { GRAVITY, FLAP_STRENGTH } from './constants';
import type { BirdState } from './types';

export class Bird {
  x: number;
  y: number;
  velocity: number;
  frameIndex: number;
  animationTimer: number;

  constructor(x?: number, y?: number) {
    // Her zaman parametre verilmeli, default olarak 100, 100 kullan
    this.x = x || 100;
    this.y = y || 100;
    this.velocity = 0;
    this.frameIndex = 0;
    this.animationTimer = 0;
  }

  flap(): void {
    this.velocity = FLAP_STRENGTH;
  }

  update(): void {
    this.velocity += GRAVITY;
    this.y += this.velocity;
    this.animationTimer += 1;
    if (this.animationTimer >= 5) {
      this.animationTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % 3;
    }
  }

  getState(): BirdState {
    return {
      x: this.x,
      y: this.y,
      velocity: this.velocity,
      frameIndex: this.frameIndex,
      animationTimer: this.animationTimer,
    };
  }

  setState(state: BirdState): void {
    this.x = state.x;
    this.y = state.y;
    this.velocity = state.velocity;
    this.frameIndex = state.frameIndex;
    this.animationTimer = state.animationTimer;
  }
}