import type { GameState, PanelName } from "../types.js";
import { GamePhase } from "../types.js";
import { formatNumber, formatMoney, formatTime } from "../constants.js";
import { NotificationSystem } from "./components/Notification.js";
import { DashboardRenderer } from "./renderer/DashboardRenderer.js";
import { TrainingRenderer } from "./renderer/TrainingRenderer.js";
import { MatchLogRenderer } from "./renderer/MatchLogRenderer.js";
import { UpgradesRenderer } from "./renderer/UpgradesRenderer.js";
import { CareerRenderer } from "./renderer/CareerRenderer.js";
import { PrestigeRenderer } from "./renderer/PrestigeRenderer.js";
import { UpgradeSystem } from "../systems/UpgradeSystem.js";

export class UIController {
  private activePanel: PanelName = "dashboard";
  private notifications: NotificationSystem;
  private upgradeSystem: UpgradeSystem;

  private dashboard: DashboardRenderer;
  private training: TrainingRenderer;
  private matchlog: MatchLogRenderer;
  private upgrades: UpgradesRenderer;
  private career: CareerRenderer;
  private prestige: PrestigeRenderer;

  private lastMoney = -1;
  private lastTP = -1;
  private lastFame = -1;
  private lastBannerState = "";

  // Callbacks wired by main.ts
  onUpgradeAttr?: (attr: string) => void;
  onBuyUpgrade?: (upgradeId: string) => void;
  onAssignDrill?: (drillId: string) => void;
  onRemoveDrill?: (slotIndex: number) => void;
  onUnlockDrill?: (drillId: string, cost: number) => void;
  onNextSeason?: () => void;
  onRetire?: (name: string, position: string) => void;

  constructor() {
    this.notifications = new NotificationSystem();
    this.upgradeSystem = new UpgradeSystem();

    this.dashboard = new DashboardRenderer();
    this.training = new TrainingRenderer();
    this.matchlog = new MatchLogRenderer();
    this.upgrades = new UpgradesRenderer(this.upgradeSystem);
    this.career = new CareerRenderer();
    this.prestige = new PrestigeRenderer();

    this.bindNav();
    this.bindGlobalActions();
  }

  render(state: GameState): void {
    this.renderHeader(state);
    this.renderBanner(state);

    switch (this.activePanel) {
      case "dashboard": this.dashboard.render(state); break;
      case "training": this.training.render(state); break;
      case "matchlog": this.matchlog.render(state); break;
      case "upgrades": this.upgrades.render(state); break;
      case "career": this.career.render(state); break;
      case "prestige": this.prestige.render(state); break;
      case "help": break; // static content, no render needed
    }
  }

  notify(messages: string[]): void {
    this.notifications.pushAll(messages);
  }

  private renderBanner(state: GameState): void {
    const { season } = state;
    const phase = season.phase;

    let bannerState: string;
    let label: string;
    let detail: string;

    if (phase === GamePhase.OffSeason || phase === GamePhase.Retired) {
      bannerState = "off-season";
      label = "Season Over";
      detail = `Season ${season.seasonNumber} complete · Go to Career to start Season ${season.seasonNumber + 1}`;
    } else if (season.gameInProgress && season.weekTimer > 0) {
      bannerState = "in-progress";
      label = "Game in Progress";
      detail = `vs ${season.currentOpponent ?? "—"}`;
    } else {
      bannerState = "next-up";
      label = "Next Up";
      if (phase === GamePhase.Playoffs) {
        const roundNames = ["Wild Card", "Divisional", "Conference Championship", "Super Bowl"];
        const roundName = roundNames[(season.playoffRound ?? 1) - 1] ?? "Playoff";
        detail = `${roundName} · in ${formatTime(season.weekTimer)}`;
      } else {
        detail = `Week ${season.currentWeek} · in ${formatTime(season.weekTimer)}`;
      }
    }

    // Update CSS class only when banner state changes
    if (bannerState !== this.lastBannerState) {
      const banner = document.getElementById("dash-game-banner");
      if (banner) {
        banner.classList.remove("game-banner--in-progress", "game-banner--next-up", "game-banner--off-season");
        banner.classList.add(`game-banner--${bannerState}`);
      }
      document.querySelector<HTMLElement>(".info-card--timer")
        ?.classList.toggle("in-progress", bannerState === "in-progress");
      this.lastBannerState = bannerState;
    }

    // Always push text — setField skips DOM write if value is unchanged
    const labelEl = document.getElementById("dash-banner-label");
    if (labelEl && labelEl.textContent !== label) labelEl.textContent = label;
    const detailEl = document.getElementById("dash-game-opp");
    if (detailEl && detailEl.textContent !== detail) detailEl.textContent = detail;
  }

  private renderHeader(state: GameState): void {
    const money = Math.floor(state.resources.money);
    if (money !== this.lastMoney) {
      const el = document.getElementById("hdr-money");
      if (el) el.textContent = formatMoney(money);
      this.lastMoney = money;
    }

    const tp = Math.floor(state.resources.trainingPoints);
    if (tp !== this.lastTP) {
      const el = document.getElementById("hdr-tp");
      if (el) el.textContent = formatNumber(tp) + " TP";
      this.lastTP = tp;
    }

    const fame = Math.floor(state.resources.fame);
    if (fame !== this.lastFame) {
      const el = document.getElementById("hdr-fame");
      if (el) el.textContent = formatNumber(fame) + " Fame";
      this.lastFame = fame;
    }
  }

  private bindNav(): void {
    document.querySelectorAll("[data-panel]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const panel = (btn as HTMLElement).dataset["panel"] as PanelName;
        this.switchPanel(panel);
      });
    });
  }

  private switchPanel(panel: PanelName): void {
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("panel--active"));
    document.querySelectorAll("[data-panel]").forEach((b) => b.classList.remove("nav-btn--active"));

    const panelEl = document.getElementById(`panel-${panel}`);
    if (panelEl) panelEl.classList.add("panel--active");

    const navBtn = document.querySelector(`[data-panel="${panel}"]`);
    if (navBtn) navBtn.classList.add("nav-btn--active");

    this.activePanel = panel;

    // Force re-render of new panel
    switch (panel) {
      case "training": this.training.forceRender(); break;
      case "matchlog": this.matchlog.forceRender(); break;
      case "upgrades": this.upgrades.forceRender(); break;
      case "career": this.career.forceRender(); break;
      case "prestige": this.prestige.forceRender(); break;
    }
  }

  private bindGlobalActions(): void {
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-action]") as HTMLElement | null;
      if (!btn) return;

      const action = btn.dataset["action"];

      switch (action) {
        case "upgrade-attr": {
          const attr = btn.dataset["attr"];
          if (attr) this.onUpgradeAttr?.(attr);
          break;
        }
        case "buy-upgrade": {
          const id = btn.dataset["upgrade"];
          if (id) this.onBuyUpgrade?.(id);
          break;
        }
        case "assign-drill": {
          const drillId = btn.dataset["drill"];
          if (drillId) this.onAssignDrill?.(drillId);
          break;
        }
        case "remove-drill": {
          const slot = parseInt(btn.dataset["slot"] ?? "-1", 10);
          if (slot >= 0) this.onRemoveDrill?.(slot);
          break;
        }
        case "unlock-drill": {
          const drillId = btn.dataset["drill"];
          const cost = parseInt(btn.dataset["cost"] ?? "0", 10);
          if (drillId) this.onUnlockDrill?.(drillId, cost);
          break;
        }
        case "next-season": {
          this.onNextSeason?.();
          break;
        }
        case "retire": {
          const nameInput = document.getElementById("prestige-name") as HTMLInputElement | null;
          const posSelect = document.getElementById("prestige-position") as HTMLSelectElement | null;
          const name = nameInput?.value.trim() ?? "";
          const pos = posSelect?.value ?? "QB";
          if (!name) {
            alert("Please enter a name for your new player.");
            return;
          }
          if (confirm(`Retire and start a new legacy career as ${name}?`)) {
            this.onRetire?.(name, pos);
          }
          break;
        }
      }
    });
  }
}
