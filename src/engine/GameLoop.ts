import type { GameState } from "../types.js";
import { TrainingEngine } from "./TrainingEngine.js";
import { SeasonEngine } from "./SeasonEngine.js";
import { EndorsementSystem } from "../systems/EndorsementSystem.js";
import { SaveManager } from "../persistence/SaveManager.js";

export interface GameLoopCallbacks {
  onNotifications(messages: string[]): void;
  onRender(state: GameState): void;
}

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private saveAccumulator = 0;

  private trainingEngine = new TrainingEngine();
  private seasonEngine = new SeasonEngine();
  private endorsementSystem = new EndorsementSystem();

  constructor(
    private state: GameState,
    private saveManager: SaveManager,
    private callbacks: GameLoopCallbacks
  ) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.tick.bind(this));
  }

  stop(): void {
    this.running = false;
  }

  getState(): GameState {
    return this.state;
  }

  /** Replace the active state (used after prestige) */
  setState(state: GameState): void {
    this.state = state;
  }

  private tick(now: number): void {
    if (!this.running) return;

    const rawDelta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta to 5 seconds — prevents huge jumps after tab is hidden
    const delta = Math.min(rawDelta, 5);

    this.trainingEngine.tick(this.state, delta);
    this.seasonEngine.tick(this.state, delta);
    this.endorsementSystem.tick(this.state, delta);

    // Flush season notifications
    const notifications = this.seasonEngine.flushNotifications();
    if (notifications.length > 0) {
      this.callbacks.onNotifications(notifications);
    }

    // Auto-save
    this.saveAccumulator += delta;
    if (this.saveAccumulator >= this.state.settings.autoSaveIntervalSeconds) {
      this.saveManager.save(this.state);
      this.saveAccumulator = 0;
    }

    this.callbacks.onRender(this.state);

    requestAnimationFrame(this.tick.bind(this));
  }
}
