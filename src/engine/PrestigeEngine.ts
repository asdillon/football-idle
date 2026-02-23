import { Position, type GameState } from "../types.js";
import { createNewGameState } from "../state/defaults.js";
import { AwardSystem } from "../systems/AwardSystem.js";

export class PrestigeEngine {
  private awardSystem = new AwardSystem();

  canRetire(state: GameState): boolean {
    return state.season.seasonNumber >= 3;
  }

  retire(state: GameState, newName: string, newPosition: Position): GameState {
    const legacy = structuredClone(state.legacy);

    // Archive career
    this.awardSystem.archiveAwards(state);
    legacy.careerAwards = [...state.legacy.careerAwards, ...state.season.awardsEarned];

    legacy.retiredPlayers.push({
      name: state.player.name,
      ovr: state.player.ovr,
      seasons: state.season.seasonNumber,
      awards: state.season.awardsEarned,
    });

    // Compute legacy bonuses
    legacy.prestigeCount++;
    legacy.permanentTPMultiplier = 1 + legacy.prestigeCount * 0.2;     // +20% TP/prestige
    legacy.permanentMoneyMultiplier = 1 + legacy.prestigeCount * 0.15;  // +15% money/prestige
    legacy.permanentStartingOVR = Math.min(10, legacy.prestigeCount * 2); // +2 starting OVR/prestige, cap 10

    // Create fresh game state with legacy carried over
    const newState = createNewGameState(newName, newPosition, legacy);
    return newState;
  }
}
