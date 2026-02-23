import type { GameState, MatchResult } from "../../types.js";
import { formatPct } from "../../constants.js";

export class MatchLogRenderer {
  private lastMatchCount = -1;
  private forceNextRender = true;

  constructor() {}

  forceRender(): void {
    this.forceNextRender = true;
    this.lastMatchCount = -1;
  }

  render(state: GameState): void {
    const count = state.season.matchHistory.length;
    if (count === this.lastMatchCount && !this.forceNextRender) return;

    this.renderMatchList(state);
    this.renderSeasonStats(state);

    this.lastMatchCount = count;
    this.forceNextRender = false;
  }

  private renderMatchList(state: GameState): void {
    const container = document.getElementById("match-list");
    if (!container) return;
    container.innerHTML = "";

    const history = [...state.season.matchHistory].reverse();

    for (const match of history) {
      const row = document.createElement("div");
      const perfClass =
        match.performanceScore >= 75
          ? "match-row--great"
          : match.performanceScore <= 35
          ? "match-row--poor"
          : "";

      row.className = `match-row ${match.win ? "match-row--win" : "match-row--loss"} ${perfClass}`;
      row.innerHTML = `
        <span class="match-row__result">${match.win ? "W" : "L"}</span>
        <span class="match-row__score">${match.teamScore}–${match.opponentScore}</span>
        <span class="match-row__opp">vs ${match.opponent}</span>
        <span class="match-row__stats">${this.formatStats(match)}</span>
        <span class="match-row__perf">${match.performanceScore.toFixed(0)}</span>
      `;
      container.appendChild(row);
    }

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">No games played yet this season.</p>';
    }
  }

  private renderSeasonStats(state: GameState): void {
    const container = document.getElementById("season-stats");
    if (!container) return;

    const history = state.season.matchHistory;
    if (history.length === 0) {
      container.innerHTML = "";
      return;
    }

    const avgPerf = history.reduce((s, m) => s + m.performanceScore, 0) / history.length;
    const totalXP = history.reduce((s, m) => s + m.xpEarned, 0);
    const totalMoney = history.reduce((s, m) => s + m.moneyEarned, 0);

    container.innerHTML = `
      <div class="stat-card">
        <span class="stat-card__label">Avg Performance</span>
        <span class="stat-card__val">${avgPerf.toFixed(1)}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Total XP</span>
        <span class="stat-card__val">${totalXP.toLocaleString()}</span>
      </div>
      <div class="stat-card">
        <span class="stat-card__label">Money Earned</span>
        <span class="stat-card__val">$${totalMoney.toLocaleString()}</span>
      </div>
    `;
  }

  private formatStats(match: MatchResult): string {
    const s = match.playerStats;
    if (s.passingYards > 0) {
      return `${s.passingYards} yds, ${s.passingTDs} TD, ${s.interceptions} INT (${formatPct(s.completionPct)})`;
    }
    if (s.rushingYards > 0 && s.receivingYards === 0) {
      return `${s.rushingYards} rush yds, ${s.rushingTDs} TD`;
    }
    if (s.receivingYards > 0) {
      return `${s.receptions} rec, ${s.receivingYards} yds, ${s.receivingTDs} TD`;
    }
    if (s.tackles > 0) {
      return `${s.tackles} tackles, ${s.sacks} sacks, ${s.defensiveInterceptions} INT`;
    }
    return `Perf: ${match.performanceScore.toFixed(0)}`;
  }
}
