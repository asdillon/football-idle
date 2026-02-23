import { SAVE_VERSION } from "../constants.js";
import type { GameState } from "../types.js";

/**
 * Migrates a loaded save to the current version.
 * Each migration step transforms the state in-place.
 */
export function migrate(raw: unknown): GameState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = raw as any;

  if (typeof state !== "object" || state === null) {
    throw new Error("Invalid save data");
  }

  let version: number = state.version ?? 0;

  if (version < 2) {
    migrateV1ToV2(state);
    version = 2;
  }

  // Always reset in-flight game state on load — prevents stuck banners
  if (state.season) {
    state.season.gameInProgress = false;
    state.season.currentOpponent = null;
  }

  state.version = SAVE_VERSION;
  return state as GameState;
}

/**
 * v1 → v2: Add tackle_circuit and pursuit_drills to defense position saves.
 * These drills didn't exist in v1. Defense positions (LB, CB, S) get them
 * automatically unlocked; others don't need them.
 */
function migrateV1ToV2(state: any): void {
  const defensePositions = ["LB", "CB", "S"];
  if (defensePositions.includes(state.player?.position)) {
    const unlocked: string[] = state.unlockedDrills ?? [];
    if (!unlocked.includes("tackle_circuit")) unlocked.push("tackle_circuit");
    if (!unlocked.includes("pursuit_drills")) unlocked.push("pursuit_drills");
    state.unlockedDrills = unlocked;
  }
}
