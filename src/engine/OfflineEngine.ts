import { GamePhase, type GameState, type OfflineSummary, type MatchResult } from "../types.js";
import { OFFLINE_CAP_HOURS, OFFLINE_TP_EFFICIENCY } from "../constants.js";
import { TrainingEngine } from "./TrainingEngine.js";
import { SeasonEngine } from "./SeasonEngine.js";
import { EndorsementSystem } from "../systems/EndorsementSystem.js";

function isSeasonActive(phase: GamePhase): boolean {
  return phase !== GamePhase.OffSeason && phase !== GamePhase.Retired;
}

export class OfflineEngine {
  private trainingEngine = new TrainingEngine();
  private seasonEngine = new SeasonEngine();
  private endorsementSystem = new EndorsementSystem();

  applyOfflineProgress(state: GameState): OfflineSummary {
    const now = Date.now();
    const elapsedMs = now - state.lastSaveTime;
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds < 10) {
      // Less than 10 seconds — nothing meaningful to apply
      state.lastSaveTime = now;
      state.lastTickTime = now;
      return { tpEarned: 0, moneyEarned: 0, matchResults: [], elapsedSeconds: 0 };
    }

    const cappedSeconds = Math.min(elapsedSeconds, OFFLINE_CAP_HOURS * 3600);

    // ── Training TP (50% efficiency offline) ─────────────────────────────────
    const ratePerSec = this.trainingEngine.getRatePerSecond(state);
    const tpEarned = ratePerSec * cappedSeconds * OFFLINE_TP_EFFICIENCY;
    state.resources.trainingPoints += tpEarned;

    // ── Endorsement Passive Income ────────────────────────────────────────────
    const endorseRate = this.endorsementSystem.getRate(state);
    const moneyEarned = endorseRate * cappedSeconds;
    state.resources.money += moneyEarned;

    // ── Matches ───────────────────────────────────────────────────────────────
    const matchResults: MatchResult[] = [];
    const secondsPerWeek = state.settings.matchIntervalSeconds;

    if (
      state.season.phase !== GamePhase.OffSeason &&
      state.season.phase !== GamePhase.Retired
    ) {
      let remainingSeconds = cappedSeconds;
      let weekTimer = state.season.weekTimer;

      // Consume the time left in the current week timer
      if (weekTimer <= remainingSeconds) {
        remainingSeconds -= weekTimer;
        weekTimer = 0;

        // Simulate that week's match and any subsequent full weeks
        while (remainingSeconds >= 0 && isSeasonActive(state.season.phase)) {
          this.seasonEngine.advanceWeek(state);
          if (state.season.matchHistory.length > 0) {
            const last = state.season.matchHistory[state.season.matchHistory.length - 1];
            if (last) matchResults.push(last);
          }

          remainingSeconds -= secondsPerWeek;
          if (remainingSeconds < 0) break;
        }

        // Set weekTimer to the remainder within the last started week
        state.season.weekTimer = secondsPerWeek + remainingSeconds; // remainingSeconds is negative
      } else {
        // Didn't even finish the current week
        state.season.weekTimer = weekTimer - cappedSeconds;
      }
    }

    state.lastSaveTime = now;
    state.lastTickTime = now;

    return { tpEarned, moneyEarned, matchResults, elapsedSeconds: cappedSeconds };
  }

}
