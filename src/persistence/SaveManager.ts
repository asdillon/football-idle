import type { GameState } from "../types.js";
import { migrate } from "./Migrator.js";

const SAVE_KEY = "nfl_idle_save";

export class SaveManager {
  save(state: GameState): void {
    try {
      state.lastSaveTime = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  }

  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      return migrate(parsed);
    } catch (e) {
      console.warn("Load failed:", e);
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }
}
