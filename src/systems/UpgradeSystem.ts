import type { GameState, AttributeKey } from "../types.js";
import {
  UPGRADE_BY_ID,
  UPGRADE_DEFINITIONS,
  attributeUpgradeCost,
  computeOVR,
} from "../constants.js";
import { TrainingEngine } from "../engine/TrainingEngine.js";

export class UpgradeSystem {
  private trainingEngine = new TrainingEngine();

  upgradeAttribute(state: GameState, attribute: AttributeKey): boolean {
    const currentLevel = state.player.attributes[attribute];
    if (currentLevel === undefined) return false;
    const cost = attributeUpgradeCost(attribute, currentLevel);

    if (state.resources.trainingPoints < cost) return false;

    state.resources.trainingPoints -= cost;
    (state.player.attributes[attribute] as number) = currentLevel + 1;
    state.player.ovr = computeOVR(state.player);

    return true;
  }

  purchaseUpgrade(state: GameState, upgradeId: string): { success: boolean; message: string } {
    const def = UPGRADE_BY_ID[upgradeId];
    if (!def) return { success: false, message: "Unknown upgrade." };

    // Check unlock requirements
    if (state.season.seasonNumber < def.unlockSeason) {
      return { success: false, message: `Unlocks in Season ${def.unlockSeason}.` };
    }
    if (state.resources.fame < def.unlockFame) {
      return { success: false, message: `Requires ${def.unlockFame} fame.` };
    }

    // Find existing purchase record
    let record = state.purchasedUpgrades.find((p) => p.upgradeId === upgradeId);

    const currentLevel = record?.level ?? 0;
    if (currentLevel >= def.maxLevel) {
      return { success: false, message: "Already at max level." };
    }

    const cost = def.costPerLevel * (currentLevel + 1);
    const currency = def.costCurrency === "money" ? state.resources.money : state.resources.contractTokens;

    if (currency < cost) {
      return { success: false, message: `Not enough ${def.costCurrency}.` };
    }

    // Deduct cost
    if (def.costCurrency === "money") {
      state.resources.money -= cost;
    } else {
      state.resources.contractTokens -= cost;
    }

    // Apply or create record
    if (record) {
      record.level++;
      record.purchasedAt = Date.now();
    } else {
      record = { upgradeId, level: 1, purchasedAt: Date.now() };
      state.purchasedUpgrades.push(record);
    }

    // Apply immediate effects
    this.applyUpgradeEffect(state, upgradeId, record.level);

    return { success: true, message: `Purchased ${def.name} (Level ${record.level})!` };
  }

  private applyUpgradeEffect(state: GameState, upgradeId: string, _level: number): void {
    const def = UPGRADE_BY_ID[upgradeId];
    if (!def) return;

    switch (def.effect.type) {
      case "slotUnlock":
        state.training.maxSlots = Math.min(5, state.training.maxSlots + 1);
        // Extend slots array if needed
        while (state.training.slots.length < state.training.maxSlots) {
          state.training.slots.push(null);
        }
        break;

      case "attributeBonus":
        if (def.effect.targetAttribute) {
          const attr = def.effect.targetAttribute;
          (state.player.attributes[attr] as number) += def.effect.magnitude;
          state.player.ovr = computeOVR(state.player);
        }
        break;

      case "drillMultiplier":
        // Recompute coach multipliers for all active drills
        this.trainingEngine.recomputeCoachMultipliers(state);
        break;

      // passiveIncome and matchBonus are computed on-the-fly in their systems
      default:
        break;
    }
  }

  /** Returns upgrade definitions visible to this player (filtered by position) */
  getAvailableUpgrades(state: GameState) {
    return UPGRADE_DEFINITIONS
      .filter((def) =>
        !def.positions || def.positions.includes(state.player.position)
      )
      .map((def) => {
        const purchased = state.purchasedUpgrades.find((p) => p.upgradeId === def.id);
        const currentLevel = purchased?.level ?? 0;
        const locked =
          state.season.seasonNumber < def.unlockSeason ||
          state.resources.fame < def.unlockFame;
        const maxed = currentLevel >= def.maxLevel;
        const cost = def.costPerLevel * (currentLevel + 1);
        const canAfford =
          def.costCurrency === "money"
            ? state.resources.money >= cost
            : state.resources.contractTokens >= cost;

        return { def, currentLevel, locked, maxed, cost, canAfford };
      });
  }

  /** Returns position-specific upgrades for this player */
  getPositionUpgrades(state: GameState) {
    return this.getAvailableUpgrades(state).filter((u) => u.def.positions !== undefined);
  }

  /** Returns general (all-position) upgrades */
  getGeneralUpgrades(state: GameState) {
    return this.getAvailableUpgrades(state).filter((u) => u.def.positions === undefined);
  }

  /** Recompute coach multipliers after a drill is added */
  refreshDrillMultipliers(state: GameState): void {
    this.trainingEngine.recomputeCoachMultipliers(state);
  }

  /** Unlock a drill for the player */
  unlockDrill(state: GameState, drillId: string): boolean {
    if (state.unlockedDrills.includes(drillId)) return false;
    state.unlockedDrills.push(drillId);
    return true;
  }
}
