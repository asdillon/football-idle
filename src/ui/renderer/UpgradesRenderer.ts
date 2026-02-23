import type { GameState } from "../../types.js";
import { UpgradeCategory } from "../../types.js";
import { formatNumber, formatMoney, POSITION_LABELS } from "../../constants.js";
import { UpgradeSystem } from "../../systems/UpgradeSystem.js";

export class UpgradesRenderer {
  private upgradeSystem: UpgradeSystem;
  private lastStateKey = "";
  private forceNextRender = true;

  constructor(upgradeSystem: UpgradeSystem) {
    this.upgradeSystem = upgradeSystem;
  }

  forceRender(): void {
    this.forceNextRender = true;
    this.lastStateKey = "";
  }

  render(state: GameState): void {
    const key =
      state.purchasedUpgrades.map((p) => `${p.upgradeId}:${p.level}`).join(",") +
      "|" +
      Math.floor(state.resources.money / 100) +
      "|" +
      state.resources.contractTokens +
      "|" +
      state.resources.fame;

    if (key === this.lastStateKey && !this.forceNextRender) return;

    // General upgrades, split by category
    this.renderFilteredCategory(state, UpgradeCategory.Equipment, "upgrades-equipment", false);
    this.renderFilteredCategory(state, UpgradeCategory.Coach, "upgrades-coach", false);
    this.renderFilteredCategory(state, UpgradeCategory.Diet, "upgrades-diet", false);
    this.renderFilteredCategory(state, UpgradeCategory.Endorsement, "upgrades-endorsement", false);

    // Position specialist section header
    const posLabelEl = document.getElementById("upgrades-position-label");
    if (posLabelEl) {
      posLabelEl.textContent = POSITION_LABELS[state.player.position] + " Specialist";
    }

    // Position-specific upgrades, all categories merged into one section
    this.renderPositionSpecialist(state);

    this.lastStateKey = key;
    this.forceNextRender = false;
  }

  private renderFilteredCategory(
    state: GameState,
    category: UpgradeCategory,
    containerId: string,
    positionOnly: boolean
  ): void {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const source = positionOnly
      ? this.upgradeSystem.getPositionUpgrades(state)
      : this.upgradeSystem.getGeneralUpgrades(state);

    const upgrades = source.filter((u) => u.def.category === category);
    this.renderCards(container, upgrades);
  }

  private renderPositionSpecialist(state: GameState): void {
    const container = document.getElementById("upgrades-position");
    if (!container) return;
    container.innerHTML = "";

    const upgrades = this.upgradeSystem.getPositionUpgrades(state);
    this.renderCards(container, upgrades);

    if (upgrades.length === 0) {
      container.innerHTML = '<p class="empty-state">No position-specific upgrades available yet.</p>';
    }
  }

  private renderCards(
    container: HTMLElement,
    upgrades: ReturnType<UpgradeSystem["getAvailableUpgrades"]>
  ): void {
    for (const { def, currentLevel, locked, maxed, cost, canAfford } of upgrades) {
      const card = document.createElement("div");
      card.className =
        "upgrade-card" +
        (locked ? " upgrade-card--locked" : "") +
        (maxed ? " upgrade-card--maxed" : "");

      const stars = "★".repeat(currentLevel) + "☆".repeat(def.maxLevel - currentLevel);

      const tierBadge = this.tierBadge(def.unlockSeason);

      card.innerHTML = `
        <div class="upgrade-card__header">
          <span class="upgrade-card__name">${def.name}</span>
          <div class="upgrade-card__meta">
            ${tierBadge}
            <span class="upgrade-card__stars">${stars}</span>
          </div>
        </div>
        <div class="upgrade-card__desc">${def.description}</div>
        <div class="upgrade-card__footer">
          ${
            maxed
              ? '<span class="badge badge--gold">MAX</span>'
              : locked
              ? `<span class="badge badge--gray">Season ${def.unlockSeason}${def.unlockFame > 0 ? ` · ${def.unlockFame} Fame` : ""}</span>`
              : `<button class="btn${canAfford ? "" : " btn--disabled"}"
                  data-action="buy-upgrade"
                  data-upgrade="${def.id}"
                  ${canAfford ? "" : "disabled"}>
                  Buy Lv ${currentLevel + 1} — ${
                    def.costCurrency === "money" ? formatMoney(cost) : `${formatNumber(cost)} tokens`
                  }
                </button>`
          }
        </div>
      `;

      container.appendChild(card);
    }

    if (upgrades.length === 0) {
      container.innerHTML = '<p class="empty-state">None available yet.</p>';
    }
  }

  private tierBadge(unlockSeason: number): string {
    if (unlockSeason === 0) return '<span class="tier-badge tier-badge--1">Tier 1</span>';
    if (unlockSeason <= 3) return '<span class="tier-badge tier-badge--2">Tier 2</span>';
    if (unlockSeason <= 7) return '<span class="tier-badge tier-badge--3">Tier 3</span>';
    return '<span class="tier-badge tier-badge--4">Tier 4</span>';
  }
}
