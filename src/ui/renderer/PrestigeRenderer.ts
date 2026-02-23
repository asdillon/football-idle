import type { GameState } from "../../types.js";
import { PrestigeEngine } from "../../engine/PrestigeEngine.js";

export class PrestigeRenderer {
  private prestigeEngine = new PrestigeEngine();
  private lastKey = "";
  private forceNextRender = true;

  constructor() {}

  forceRender(): void {
    this.forceNextRender = true;
    this.lastKey = "";
  }

  render(state: GameState): void {
    const key = `${state.legacy.prestigeCount}|${state.season.seasonNumber}`;
    if (key === this.lastKey && !this.forceNextRender) return;

    this.renderLegacy(state);
    this.renderPrestigeAction(state);

    this.lastKey = key;
    this.forceNextRender = false;
  }

  private renderLegacy(state: GameState): void {
    const el = document.getElementById("prestige-legacy");
    if (!el) return;

    const { legacy } = state;

    el.innerHTML = `
      <div class="info-row"><span>Prestige count</span><span>${legacy.prestigeCount}</span></div>
      <div class="info-row"><span>TP multiplier</span><span>×${legacy.permanentTPMultiplier.toFixed(1)}</span></div>
      <div class="info-row"><span>Money multiplier</span><span>×${legacy.permanentMoneyMultiplier.toFixed(1)}</span></div>
      <div class="info-row"><span>Starting OVR bonus</span><span>+${legacy.permanentStartingOVR}</span></div>
      ${
        legacy.retiredPlayers.length > 0
          ? `<h4>Retired Players</h4>` +
            legacy.retiredPlayers
              .map((p) => `<div class="info-row"><span>${p.name} (${p.ovr} OVR, ${p.seasons} seasons)</span></div>`)
              .join("")
          : ""
      }
    `;
  }

  private renderPrestigeAction(state: GameState): void {
    const el = document.getElementById("prestige-action");
    if (!el) return;

    const canRetire = this.prestigeEngine.canRetire(state);

    el.innerHTML = `
      <div class="prestige-info">
        <p>Retiring earns permanent bonuses for your next career:</p>
        <ul>
          <li>+20% Training Point gain</li>
          <li>+15% Money income</li>
          <li>+2 Starting OVR</li>
        </ul>
      </div>
      ${
        canRetire
          ? `
        <div class="prestige-form">
          <input type="text" id="prestige-name" placeholder="New player name" maxlength="24" />
          <select id="prestige-position">
            <option value="QB">Quarterback</option>
            <option value="RB">Running Back</option>
            <option value="WR">Wide Receiver</option>
            <option value="TE">Tight End</option>
            <option value="LB">Linebacker</option>
            <option value="CB">Cornerback</option>
            <option value="S">Safety</option>
          </select>
          <button class="btn btn--danger" data-action="retire">Retire &amp; Start Legacy Career</button>
        </div>`
          : `<p class="empty-state">You must complete at least 3 seasons before retiring.</p>`
      }
    `;
  }
}
