import {
  GamePhase,
  Position,
  type GameState,
  type LegacyState,
  type Resources,
  type SeasonState,
  type Contract,
  type TrainingState,
  type Player,
} from "../types.js";
import {
  computeOVR,
  getStartingAttributes,
  getStartingDrillIds,
  SAVE_VERSION,
  PLAYER_STARTING_AGE,
} from "../constants.js";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultPlayer(name: string, position: Position, legacyBonus: number): Player {
  const attributes = getStartingAttributes(position, legacyBonus);
  const player: Player = {
    id: generateId(),
    name,
    position,
    age: PLAYER_STARTING_AGE,
    attributes,
    ovr: 50,
    totalXP: 0,
    fame: 0,
    legacyPoints: 0,
  };
  player.ovr = computeOVR(player);
  return player;
}

function createDefaultResources(): Resources {
  return {
    money: 1000,
    trainingPoints: 0,
    fame: 0,
    contractTokens: 0,
    xp: 0,
  };
}

function createDefaultTraining(position: Position): TrainingState {
  const drillIds = getStartingDrillIds(position);
  const slots = drillIds.slice(0, 3).map((drillId, index) => ({
    slotIndex: index,
    drillId,
    accumulatedTP: 0,
    coachMultiplier: 1,
  }));
  // Pad to 3 slots
  while (slots.length < 3) {
    slots.push(null as never);
  }
  return {
    slots: [slots[0] ?? null, slots[1] ?? null, slots[2] ?? null],
    maxSlots: 3,
    trainingPoints: 0,
  };
}

function createDefaultContract(): Contract {
  return {
    yearsRemaining: 4,
    salaryPerGame: 50000,
    signingBonus: 500000,
    contractTokens: 0,
  };
}

function createDefaultSeason(): SeasonState {
  return {
    seasonNumber: 1,
    currentWeek: 1,
    phase: GamePhase.RegularSeason,
    teamRecord: { wins: 0, losses: 0 },
    playoffRound: null,
    matchHistory: [],
    awardsEarned: [],
    weekTimer: 60, // first match in 60 seconds
    gameInProgress: false,
    currentOpponent: null,
  };
}

export function createDefaultLegacy(): LegacyState {
  return {
    prestigeCount: 0,
    permanentTPMultiplier: 1,
    permanentMoneyMultiplier: 1,
    permanentStartingOVR: 0,
    careerAwards: [],
    retiredPlayers: [],
  };
}

export function createNewGameState(
  name: string,
  position: Position,
  existingLegacy?: LegacyState
): GameState {
  const legacy = existingLegacy ?? createDefaultLegacy();
  const legacyBonus = legacy.permanentStartingOVR;
  const player = createDefaultPlayer(name, position, legacyBonus);
  const training = createDefaultTraining(position);
  const unlockedDrills = getStartingDrillIds(position);

  const now = Date.now();

  return {
    version: SAVE_VERSION,
    lastSaveTime: now,
    lastTickTime: now,
    player,
    resources: createDefaultResources(),
    training,
    contract: createDefaultContract(),
    season: createDefaultSeason(),
    purchasedUpgrades: [],
    unlockedDrills,
    legacy,
    settings: {
      autoSaveIntervalSeconds: 30,
      matchIntervalSeconds: 60,
      notificationsEnabled: true,
    },
  };
}
