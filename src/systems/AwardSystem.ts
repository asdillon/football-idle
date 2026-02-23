import { AwardType, type GameState } from "../types.js";

export class AwardSystem {
  /** Returns all awards earned this season (already stored on season state by SeasonEngine) */
  getSeasonAwards(state: GameState): AwardType[] {
    return state.season.awardsEarned;
  }

  /** All-time career awards including legacy */
  getAllCareerAwards(state: GameState): AwardType[] {
    return [
      ...state.legacy.careerAwards,
      ...state.season.awardsEarned,
    ];
  }

  /** Consolidate current season awards into legacy on prestige/retirement */
  archiveAwards(state: GameState): void {
    for (const award of state.season.awardsEarned) {
      if (!state.legacy.careerAwards.includes(award)) {
        state.legacy.careerAwards.push(award);
      }
    }
  }

  awardLabel(award: AwardType): string {
    const labels: Record<AwardType, string> = {
      [AwardType.ProBowl]: "Pro Bowl",
      [AwardType.MVP]: "League MVP",
      [AwardType.OffensivePlayerOfYear]: "Offensive Player of the Year",
      [AwardType.DefensivePlayerOfYear]: "Defensive Player of the Year",
      [AwardType.SuperBowlChamp]: "Super Bowl Champion",
      [AwardType.SuperBowlMVP]: "Super Bowl MVP",
      [AwardType.RookieOfYear]: "Rookie of the Year",
    };
    return labels[award] ?? award;
  }
}
