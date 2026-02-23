import type { GameState } from "../../types.js";
import { GamePhase } from "../../types.js";
import { formatMoney } from "../../constants.js";
import { AwardSystem } from "../../systems/AwardSystem.js";

export class CareerRenderer {
  private awardSystem = new AwardSystem();
  private lastStateKey = "";
  private forceNextRender = true;

  constructor() {}

  forceRender(): void {
    this.forceNextRender = true;
    this.lastStateKey = "";
  }

  render(state: GameState): void {
    const key = `${state.season.seasonNumber}|${state.season.phase}|${state.contract.yearsRemaining}|${state.resources.contractTokens}`;
    if (key === this.lastStateKey && !this.forceNextRender) return;

    this.renderContract(state);
    this.renderAwards(state);
    this.renderOffSeason(state);

    this.lastStateKey = key;
    this.forceNextRender = false;
  }

  private renderContract(state: GameState): void {
    const el = document.getElementById("career-contract");
    if (!el) return;

    el.innerHTML = `
      <div class="info-row"><span>Salary per game</span><span>${formatMoney(state.contract.salaryPerGame)}</span></div>
      <div class="info-row"><span>Years remaining</span><span>${state.contract.yearsRemaining}</span></div>
      <div class="info-row"><span>Contract tokens</span><span>${state.resources.contractTokens}</span></div>
    `;
  }

  private renderAwards(state: GameState): void {
    const el = document.getElementById("career-awards");
    if (!el) return;

    const allAwards = this.awardSystem.getAllCareerAwards(state);
    if (allAwards.length === 0) {
      el.innerHTML = '<p class="empty-state">No awards yet — keep playing!</p>';
      return;
    }

    el.innerHTML = allAwards
      .map((a) => `<span class="award-badge">${this.awardSystem.awardLabel(a)}</span>`)
      .join("");
  }

  private renderOffSeason(state: GameState): void {
    const el = document.getElementById("career-offseason");
    if (!el) return;

    if (state.season.phase !== GamePhase.OffSeason) {
      el.innerHTML = "";
      return;
    }

    el.innerHTML = `
      <div class="offseason-panel">
        <h3>Off-Season</h3>
        <p>Season ${state.season.seasonNumber} is complete. You finished <strong>${state.season.teamRecord.wins}-${state.season.teamRecord.losses}</strong>.</p>
        <p>Awards this season: ${state.season.awardsEarned.length > 0 ? state.season.awardsEarned.map((a) => this.awardSystem.awardLabel(a)).join(", ") : "None"}</p>
        <button class="btn btn--primary" data-action="next-season">Start Next Season</button>
      </div>
    `;
  }
}
