import type { GameState, AttributeKey } from "../../types.js";
import {
  formatNumber,
  attributeUpgradeCost,
  DRILL_BY_ID,
  DRILL_DEFINITIONS,
  OVR_WEIGHTS,
} from "../../constants.js";

export class TrainingRenderer {
  private lastTP = -1;
  private lastSlotKey = "";
  private lastAttrKey = "";
  private forceNextRender = true;

  constructor() {}

  forceRender(): void {
    this.forceNextRender = true;
    this.lastTP = -1;
    this.lastSlotKey = "";
    this.lastAttrKey = "";
  }

  render(state: GameState): void {
    const tp = Math.floor(state.resources.trainingPoints);
    if (tp !== this.lastTP) {
      const el = document.getElementById("train-tp");
      if (el) el.textContent = formatNumber(tp) + " TP";
      this.lastTP = tp;
    }

    // Drill rate display
    const rateEl = document.getElementById("train-rate");
    if (rateEl) {
      let rate = 0;
      for (const slot of state.training.slots) {
        if (!slot) continue;
        const drill = DRILL_BY_ID[slot.drillId];
        if (drill) rate += drill.baseRatePerSecond * slot.coachMultiplier;
      }
      rateEl.textContent = rate.toFixed(2) + " TP/s";
    }

    const slotKey = JSON.stringify(state.training.slots.map((s) => s?.drillId ?? null)) + "|" + state.unlockedDrills.join(",");
    if (slotKey !== this.lastSlotKey || this.forceNextRender) {
      this.renderDrillSlots(state);
      this.lastSlotKey = slotKey;
    }

    const attrKey =
      JSON.stringify(state.player.attributes) +
      "|" +
      Math.floor(state.resources.trainingPoints / 10);
    if (attrKey !== this.lastAttrKey || this.forceNextRender) {
      this.renderAttributes(state);
      this.lastAttrKey = attrKey;
    }

    this.forceNextRender = false;
  }

  private renderDrillSlots(state: GameState): void {
    const container = document.getElementById("drill-slots");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < state.training.maxSlots; i++) {
      const slot = state.training.slots[i] ?? null;
      const slotEl = document.createElement("div");
      slotEl.className = "drill-slot" + (slot ? " drill-slot--active" : "");

      if (slot) {
        const drill = DRILL_BY_ID[slot.drillId];
        if (drill) {
          slotEl.innerHTML = `
            <div class="drill-slot__name">${drill.name}</div>
            <div class="drill-slot__stat">+${(drill.baseRatePerSecond * slot.coachMultiplier).toFixed(2)} TP/s → ${titleCase(drill.targetAttribute)}</div>
            <button class="btn btn--small btn--danger" data-action="remove-drill" data-slot="${i}">Remove</button>
          `;
        }
      } else {
        slotEl.innerHTML = `<span class="drill-slot__empty">Empty Slot — click a drill below to assign</span>`;
      }

      container.appendChild(slotEl);
    }

    // Available drills list
    const drillList = document.getElementById("available-drills");
    if (!drillList) return;
    drillList.innerHTML = "";

    for (const drill of DRILL_DEFINITIONS) {
      if (!state.unlockedDrills.includes(drill.id)) continue;
      const isActive = state.training.slots.some((s) => s?.drillId === drill.id);
      const canUnlock =
        !state.unlockedDrills.includes(drill.id) &&
        drill.cost > 0 &&
        state.resources.money >= drill.cost;

      const el = document.createElement("div");
      el.className = "drill-card" + (isActive ? " drill-card--active" : "");
      el.innerHTML = `
        <div class="drill-card__name">${drill.name}</div>
        <div class="drill-card__desc">${drill.description}</div>
        <div class="drill-card__rate">${drill.baseRatePerSecond}/s → ${titleCase(drill.targetAttribute)}</div>
        ${isActive ? '<span class="badge badge--green">Active</span>' : `<button class="btn btn--small" data-action="assign-drill" data-drill="${drill.id}">Assign</button>`}
      `;
      drillList.appendChild(el);
      void canUnlock; // suppress unused
    }

    // Locked drills teaser
    const locked = DRILL_DEFINITIONS.filter(
      (d) => !state.unlockedDrills.includes(d.id) && d.unlockSeason <= state.season.seasonNumber
    );
    for (const drill of locked) {
      const el = document.createElement("div");
      el.className = "drill-card drill-card--locked";
      el.innerHTML = `
        <div class="drill-card__name">${drill.name}</div>
        <div class="drill-card__desc">${drill.description}</div>
        <button class="btn btn--small" data-action="unlock-drill" data-drill="${drill.id}" data-cost="${drill.cost}">
          Unlock — $${formatNumber(drill.cost)}
        </button>
      `;
      drillList.appendChild(el);
    }
  }

  private renderAttributes(state: GameState): void {
    const container = document.getElementById("attr-list");
    if (!container) return;
    container.innerHTML = "";

    const weights = OVR_WEIGHTS[state.player.position];
    const relevantAttrs = Object.keys(weights) as AttributeKey[];

    // Show all attributes, but highlight position-relevant ones
    const allAttrs: AttributeKey[] = [
      "speed", "strength", "stamina", "awareness",
      "throwPower", "throwAccuracy", "mobility",
      "catching", "routeRunning",
      "ballCarrying", "elusiveness",
      "tackle", "coverage", "pursuit",
    ];

    for (const attr of allAttrs) {
      const val = state.player.attributes[attr];
      if (val === undefined) continue;

      const cost = attributeUpgradeCost(attr, val);
      const canAfford = state.resources.trainingPoints >= cost;
      const isKey = relevantAttrs.includes(attr);

      const row = document.createElement("div");
      row.className = "attr-row" + (isKey ? " attr-row--key" : "");
      row.innerHTML = `
        <span class="attr-row__name">${titleCase(attr)}${isKey ? " ★" : ""}</span>
        <span class="attr-row__val">${val}</span>
        <div class="attr-row__bar">
          <div class="attr-row__fill" style="width:${((val - 40) / 59) * 100}%"></div>
        </div>
        <button class="btn btn--small${canAfford ? "" : " btn--disabled"}"
          data-action="upgrade-attr"
          data-attr="${attr}"
          ${canAfford ? "" : "disabled"}>
          +1 (${formatNumber(cost)} TP)
        </button>
      `;
      container.appendChild(row);
    }
  }
}

function titleCase(str: string): string {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
