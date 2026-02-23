import type { GameState } from "../types.js";
import { UPGRADE_BY_ID } from "../constants.js";

export class EndorsementSystem {
  tick(state: GameState, delta: number): void {
    const rate = this.getRate(state);
    state.resources.money += rate * delta;
  }

  getRate(state: GameState): number {
    let rate = 0;
    for (const pu of state.purchasedUpgrades) {
      const def = UPGRADE_BY_ID[pu.upgradeId];
      if (!def) continue;
      if (def.effect.type === "passiveIncome") {
        rate += def.effect.magnitude * pu.level;
      }
    }
    return rate * state.legacy.permanentMoneyMultiplier;
  }
}
