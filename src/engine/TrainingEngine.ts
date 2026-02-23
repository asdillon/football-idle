import type { GameState } from "../types.js";
import { DRILL_BY_ID, UPGRADE_BY_ID, OFFLINE_TP_EFFICIENCY } from "../constants.js";

export class TrainingEngine {
  tick(state: GameState, delta: number, offlineMode = false): void {
    const efficiency = offlineMode ? OFFLINE_TP_EFFICIENCY : 1;
    let tpGained = 0;

    for (const slot of state.training.slots) {
      if (!slot) continue;
      const drill = DRILL_BY_ID[slot.drillId];
      if (!drill) continue;

      const rate = drill.baseRatePerSecond * slot.coachMultiplier * this.getGlobalMultiplier(state);
      const gained = rate * delta * efficiency;
      state.resources.trainingPoints += gained;
      slot.accumulatedTP += gained;
      tpGained += gained;
    }

    return;
  }

  private getGlobalMultiplier(state: GameState): number {
    let multiplier = 1;
    multiplier *= state.legacy.permanentTPMultiplier;

    for (const pu of state.purchasedUpgrades) {
      const def = UPGRADE_BY_ID[pu.upgradeId];
      if (!def) continue;
      if (def.effect.type === "drillMultiplier" && def.effect.targetDrillType === undefined) {
        // Global drill multiplier (nutrition plan)
        multiplier += def.effect.magnitude * pu.level;
      }
    }

    return multiplier;
  }

  /** Recompute coach multipliers for a slot based on purchased upgrades */
  recomputeCoachMultipliers(state: GameState): void {
    for (const slot of state.training.slots) {
      if (!slot) continue;
      const drill = DRILL_BY_ID[slot.drillId];
      if (!drill) continue;

      let multiplier = 1;
      for (const pu of state.purchasedUpgrades) {
        const def = UPGRADE_BY_ID[pu.upgradeId];
        if (!def) continue;
        if (
          def.effect.type === "drillMultiplier" &&
          def.effect.targetDrillType === drill.type
        ) {
          multiplier += def.effect.magnitude * pu.level;
        }
      }
      slot.coachMultiplier = multiplier;
    }
  }

  /** Total TP earned per second at current state (used by offline engine) */
  getRatePerSecond(state: GameState): number {
    let total = 0;
    const globalMult = this.getGlobalMultiplier(state);

    for (const slot of state.training.slots) {
      if (!slot) continue;
      const drill = DRILL_BY_ID[slot.drillId];
      if (!drill) continue;
      total += drill.baseRatePerSecond * slot.coachMultiplier * globalMult;
    }

    return total;
  }
}
