import {
  Position,
  type GameState,
  type MatchResult,
  type PlayerGameStats,
} from "../types.js";
import { NFL_TEAM_NAMES, UPGRADE_BY_ID } from "../constants.js";

export class MatchEngine {
  simulateMatch(state: GameState): MatchResult {
    const { player, season } = state;

    // 1. Base performance score from OVR (40-99 → 0-100)
    const baseScore = ((player.ovr - 40) / 59) * 100;

    // 2. Sum of 3 uniforms shifted to center near 0 (box-muller approximation)
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 20;

    // 3. Equipment bonus — capped at 15 so it aids early progress without trivialising late game
    const rawEquip = this.getMatchEquipBonus(state);
    const equipBonus = Math.min(15, rawEquip);

    const rawScore = baseScore + noise + equipBonus;
    const performanceScore = Math.max(0, Math.min(100, rawScore));

    // 4. Win/loss: threshold rises 2pts per season (was 1.5), making late seasons genuinely hard
    const winThreshold = 47 + season.seasonNumber * 2;
    const winJitter = (Math.random() - 0.5) * 15;
    const win = performanceScore > winThreshold + winJitter;

    // 5. Generate realistic scores
    const teamScore = win
      ? randomInt(21, 38)
      : randomInt(7, 24);
    const opponentScore = win
      ? randomInt(7, teamScore - 1)
      : randomInt(teamScore + 1, teamScore + 21);

    // 6. Generate stat lines
    const playerStats = this.generateStats(player.position, performanceScore);

    // 7. Rewards
    const moneyMultiplier = state.legacy.permanentMoneyMultiplier;
    const xpEarned = Math.floor(performanceScore * 2 + (win ? 50 : 10));
    const moneyEarned = Math.floor(
      (performanceScore * 500 + state.contract.salaryPerGame) * moneyMultiplier
    );
    const fameEarned = Math.floor(performanceScore * 0.5 + (win ? 5 : 0));

    // 8. Use pre-selected opponent (set when game-in-progress started) or pick random
    const opponent = state.season.currentOpponent ?? (NFL_TEAM_NAMES[randomInt(0, NFL_TEAM_NAMES.length - 1)] ?? "Opponents");

    return {
      week: season.currentWeek,
      season: season.seasonNumber,
      opponent,
      playerStats,
      teamScore,
      opponentScore,
      win,
      xpEarned,
      moneyEarned,
      fameEarned,
      performanceScore,
    };
  }

  private getMatchEquipBonus(state: GameState): number {
    let bonus = 0;
    for (const pu of state.purchasedUpgrades) {
      const def = UPGRADE_BY_ID[pu.upgradeId];
      if (!def) continue;
      if (def.effect.type === "matchBonus") {
        bonus += def.effect.magnitude * pu.level;
      }
    }
    return bonus;
  }

  private generateStats(position: Position, perf: number): PlayerGameStats {
    const p = perf / 100;
    const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

    const base: PlayerGameStats = {
      passingYards: 0,
      passingTDs: 0,
      interceptions: 0,
      completionPct: 0,
      rushingYards: 0,
      rushingTDs: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTDs: 0,
      tackles: 0,
      sacks: 0,
      defensiveInterceptions: 0,
    };

    switch (position) {
      case Position.QB:
        base.passingYards = Math.floor(p * rand(250, 400));
        base.passingTDs = Math.floor(p * rand(1, 5));
        base.interceptions = Math.floor((1 - p) * rand(0, 3));
        base.completionPct = Math.min(1, p * rand(0.85, 1.05));
        base.rushingYards = Math.floor(p * rand(0, 40));
        break;

      case Position.RB:
        base.rushingYards = Math.floor(p * rand(60, 180));
        base.rushingTDs = Math.floor(p * rand(0, 3));
        base.receptions = Math.floor(p * rand(0, 6));
        base.receivingYards = Math.floor(p * rand(0, 50));
        break;

      case Position.WR:
        base.receptions = Math.floor(p * rand(3, 12));
        base.receivingYards = Math.floor(p * rand(40, 180));
        base.receivingTDs = Math.floor(p * rand(0, 3));
        break;

      case Position.TE:
        base.receptions = Math.floor(p * rand(2, 9));
        base.receivingYards = Math.floor(p * rand(20, 120));
        base.receivingTDs = Math.floor(p * rand(0, 2));
        break;

      case Position.LB:
        base.tackles = Math.floor(p * rand(4, 15));
        base.sacks = Math.floor(p * rand(0, 2));
        base.defensiveInterceptions = Math.random() < p * 0.1 ? 1 : 0;
        break;

      case Position.CB:
      case Position.S:
        base.tackles = Math.floor(p * rand(2, 10));
        base.defensiveInterceptions = Math.random() < p * 0.2 ? 1 : 0;
        base.sacks = Math.random() < p * 0.05 ? 1 : 0;
        break;
    }

    return base;
  }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
