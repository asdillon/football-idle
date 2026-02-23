import {
  GamePhase,
  AwardType,
  type GameState,
  type MatchResult,
} from "../types.js";
import { REGULAR_SEASON_WEEKS, GAME_DURATION_SECONDS, NFL_TEAM_NAMES, computeOVR } from "../constants.js";
import { MatchEngine } from "./MatchEngine.js";

export class SeasonEngine {
  private matchEngine = new MatchEngine();
  private pendingNotifications: string[] = [];

  tick(state: GameState, delta: number): void {
    if (
      state.season.phase === GamePhase.OffSeason ||
      state.season.phase === GamePhase.Retired
    ) {
      return;
    }

    state.season.weekTimer -= delta;

    // Enter game-in-progress state when countdown hits the game window
    if (
      !state.season.gameInProgress &&
      state.season.weekTimer <= GAME_DURATION_SECONDS &&
      state.season.weekTimer > 0
    ) {
      state.season.gameInProgress = true;
      const idx = Math.floor(Math.random() * NFL_TEAM_NAMES.length);
      state.season.currentOpponent = NFL_TEAM_NAMES[idx] ?? "Opponents";
      this.pendingNotifications.push(
        `🏈 Game in progress vs ${state.season.currentOpponent}...`
      );
    }

    if (state.season.weekTimer <= 0) {
      this.advanceWeek(state);
      state.season.weekTimer = state.settings.matchIntervalSeconds;
    }
  }

  advanceWeek(state: GameState): void {
    state.season.gameInProgress = false;

    if (state.season.phase === GamePhase.RegularSeason) {
      const result = this.matchEngine.simulateMatch(state);
      this.applyMatchResult(state, result);

      if (result.win) state.season.teamRecord.wins++;
      else state.season.teamRecord.losses++;

      const outcome = result.win ? "WIN" : "LOSS";
      const msg = `Game complete — ${outcome} ${result.teamScore}-${result.opponentScore} vs ${result.opponent}`;
      this.pendingNotifications.push(msg);

      state.season.currentOpponent = null;
      state.season.currentWeek++;

      if (state.season.currentWeek > REGULAR_SEASON_WEEKS) {
        this.endRegularSeason(state);
      }
    } else if (state.season.phase === GamePhase.Playoffs) {
      this.advancePlayoffWeek(state);
    }
  }

  applyMatchResult(state: GameState, result: MatchResult): void {
    state.season.matchHistory.push(result);
    state.resources.money += result.moneyEarned;
    state.resources.xp += result.xpEarned;
    state.resources.fame += result.fameEarned;
    state.player.totalXP += result.xpEarned;
    state.player.age; // track for display

    // Age the player by 1/17 of a year per game
    // (age is updated at season end instead — see endRegularSeason)
  }

  private endRegularSeason(state: GameState): void {
    const wins = state.season.teamRecord.wins;
    const totalGames = REGULAR_SEASON_WEEKS;
    const winPct = wins / totalGames;

    // Evaluate regular season awards
    this.evaluateSeasonAwards(state, winPct);

    // Earn a contract token for the season
    state.resources.contractTokens += 1;

    if (wins >= 9) {
      // Made playoffs
      state.season.phase = GamePhase.Playoffs;
      state.season.playoffRound = 1;
      this.pendingNotifications.push("Your team made the playoffs!");
    } else {
      this.startOffSeason(state);
    }
  }

  private advancePlayoffWeek(state: GameState): void {
    const round = state.season.playoffRound ?? 1;
    const result = this.matchEngine.simulateMatch(state);
    this.applyMatchResult(state, result);
    state.season.currentOpponent = null;

    if (result.win) {
      state.season.teamRecord.wins++;

      if (round >= 3) {
        // Won Super Bowl
        state.season.awardsEarned.push(AwardType.SuperBowlChamp);
        this.pendingNotifications.push("🏆 YOU WON THE SUPER BOWL!");

        // Check Super Bowl MVP (high performance)
        if (result.performanceScore > 75) {
          state.season.awardsEarned.push(AwardType.SuperBowlMVP);
          this.pendingNotifications.push("🏆 You were named Super Bowl MVP!");
        }

        this.startOffSeason(state);
      } else {
        state.season.playoffRound = round + 1;
        this.pendingNotifications.push(
          `Playoff win! Advancing to round ${round + 1}`
        );
      }
    } else {
      state.season.teamRecord.losses++;
      this.pendingNotifications.push("Eliminated from the playoffs.");
      this.startOffSeason(state);
    }
  }

  startOffSeason(state: GameState): void {
    state.season.phase = GamePhase.OffSeason;
    state.player.age++;

    // Recompute OVR (attribute bonuses from equipment are permanent)
    state.player.ovr = computeOVR(state.player);

    this.pendingNotifications.push(
      `Season ${state.season.seasonNumber} complete! Record: ${state.season.teamRecord.wins}-${state.season.teamRecord.losses}`
    );
  }

  advanceToNextSeason(state: GameState): void {
    state.season = {
      seasonNumber: state.season.seasonNumber + 1,
      currentWeek: 1,
      phase: GamePhase.RegularSeason,
      teamRecord: { wins: 0, losses: 0 },
      playoffRound: null,
      matchHistory: [],
      awardsEarned: [],
      weekTimer: state.settings.matchIntervalSeconds,
      gameInProgress: false,
      currentOpponent: null,
    };
  }

  private evaluateSeasonAwards(state: GameState, winPct: number): void {
    const history = state.season.matchHistory;
    const avgPerf =
      history.reduce((s, m) => s + m.performanceScore, 0) / (history.length || 1);

    // Pro Bowl: top performers
    if (avgPerf > 70) {
      state.season.awardsEarned.push(AwardType.ProBowl);
      this.pendingNotifications.push("You were selected to the Pro Bowl!");
    }

    // MVP: dominant season + team success
    if (avgPerf > 85 && winPct >= 0.7) {
      state.season.awardsEarned.push(AwardType.MVP);
      this.pendingNotifications.push("You won the League MVP award!");
    }

    // Rookie of Year: first season
    if (state.season.seasonNumber === 1 && avgPerf > 55) {
      state.season.awardsEarned.push(AwardType.RookieOfYear);
      this.pendingNotifications.push("You won Rookie of the Year!");
    }
  }

  flushNotifications(): string[] {
    const n = this.pendingNotifications.slice();
    this.pendingNotifications = [];
    return n;
  }
}
