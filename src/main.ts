import { Position, type GameState } from "./types.js";
import { createNewGameState } from "./state/defaults.js";
import { SaveManager } from "./persistence/SaveManager.js";
import { OfflineEngine } from "./engine/OfflineEngine.js";
import { GameLoop } from "./engine/GameLoop.js";
import { UIController } from "./ui/UIController.js";
import { CreationScreen } from "./ui/CreationScreen.js";
import { UpgradeSystem } from "./systems/UpgradeSystem.js";
import { ContractSystem } from "./systems/ContractSystem.js";
import { SeasonEngine } from "./engine/SeasonEngine.js";
import { PrestigeEngine } from "./engine/PrestigeEngine.js";
import { AwardSystem } from "./systems/AwardSystem.js";
import { DRILL_BY_ID } from "./constants.js";

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const saveManager = new SaveManager();
const upgradeSystem = new UpgradeSystem();
const contractSystem = new ContractSystem();
const seasonEngine = new SeasonEngine();
const prestigeEngine = new PrestigeEngine();
const awardSystem = new AwardSystem();
const offlineEngine = new OfflineEngine();
const ui = new UIController();

let gameLoop: GameLoop | null = null;
let currentState: GameState | null = null;

function startGame(state: GameState): void {
  currentState = state;

  // Apply offline progress if this is a returning session
  const summary = offlineEngine.applyOfflineProgress(state);
  if (summary.elapsedSeconds > 60 && (summary.tpEarned > 1 || summary.matchResults.length > 0)) {
    const mins = Math.floor(summary.elapsedSeconds / 60);
    ui.notify([
      `Welcome back! You were away for ~${mins} minute${mins !== 1 ? "s" : ""}.`,
      ...(summary.tpEarned > 1 ? [`Earned ${summary.tpEarned.toFixed(0)} TP while away.`] : []),
      ...(summary.matchResults.length > 0
        ? [`${summary.matchResults.length} game(s) played while away.`]
        : []),
    ]);
  }

  // Wire UI callbacks
  ui.onUpgradeAttr = (attr) => {
    if (!currentState) return;
    const ok = upgradeSystem.upgradeAttribute(currentState, attr as never);
    if (!ok) ui.notify(["Not enough Training Points!"]);
  };

  ui.onBuyUpgrade = (upgradeId) => {
    if (!currentState) return;
    const result = upgradeSystem.purchaseUpgrade(currentState, upgradeId);
    ui.notify([result.message]);
  };

  ui.onAssignDrill = (drillId) => {
    if (!currentState) return;
    const state = currentState;
    // Find first empty slot
    const emptySlot = state.training.slots.findIndex((s) => s === null);
    if (emptySlot === -1) {
      ui.notify(["No empty drill slots! Remove a drill first."]);
      return;
    }
    // Check not already assigned
    if (state.training.slots.some((s) => s?.drillId === drillId)) {
      ui.notify(["That drill is already active."]);
      return;
    }
    state.training.slots[emptySlot] = {
      slotIndex: emptySlot,
      drillId,
      accumulatedTP: 0,
      coachMultiplier: 1,
    };
    upgradeSystem.refreshDrillMultipliers(state);
  };

  ui.onRemoveDrill = (slotIndex) => {
    if (!currentState) return;
    currentState.training.slots[slotIndex] = null;
  };

  ui.onUnlockDrill = (drillId, cost) => {
    if (!currentState) return;
    if (currentState.resources.money < cost) {
      ui.notify(["Not enough money to unlock this drill."]);
      return;
    }
    currentState.resources.money -= cost;
    upgradeSystem.unlockDrill(currentState, drillId);
    ui.notify([`Unlocked drill: ${DRILL_BY_ID[drillId]?.name ?? drillId}`]);
  };

  ui.onNextSeason = () => {
    if (!currentState) return;
    awardSystem.archiveAwards(currentState);
    contractSystem.processSeasonEnd(currentState);
    seasonEngine.advanceToNextSeason(currentState);
    saveManager.save(currentState);
    ui.notify([`Season ${currentState.season.seasonNumber} begins!`]);
  };

  ui.onRetire = (name, positionStr) => {
    if (!currentState) return;
    const position = positionStr as Position;
    const newState = prestigeEngine.retire(currentState, name, position);
    currentState = newState;
    gameLoop?.setState(newState);
    saveManager.save(newState);
    ui.notify([`New legacy career started as ${name}!`]);
  };

  // Start game loop
  gameLoop = new GameLoop(state, saveManager, {
    onNotifications: (msgs) => ui.notify(msgs),
    onRender: (s) => ui.render(s),
  });

  gameLoop.start();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init(): void {
  const saved = saveManager.load();

  if (saved) {
    startGame(saved);
  } else {
    // Show creation screen
    const creation = new CreationScreen((name, position) => {
      const state = createNewGameState(name, position);
      saveManager.save(state);
      creation.hide();
      startGame(state);
    });
    creation.show();
  }
}

// Wait for DOM
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
