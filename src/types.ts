// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Position {
  QB = "QB",
  RB = "RB",
  WR = "WR",
  TE = "TE",
  LB = "LB",
  CB = "CB",
  S = "S",
}

export enum DrillType {
  Sprint = "Sprint",
  WeightRoom = "WeightRoom",
  RouteRunning = "RouteRunning",
  ThrowingMechanics = "ThrowingMechanics",
  FilmStudy = "FilmStudy",
  Agility = "Agility",
  Coverage = "Coverage",
  PlaybookStudy = "PlaybookStudy",
  BlockingTechnique = "BlockingTechnique",
}

export enum UpgradeCategory {
  Equipment = "Equipment",
  Coach = "Coach",
  Diet = "Diet",
  Endorsement = "Endorsement",
}

export enum AwardType {
  ProBowl = "ProBowl",
  MVP = "MVP",
  OffensivePlayerOfYear = "OffensivePlayerOfYear",
  DefensivePlayerOfYear = "DefensivePlayerOfYear",
  SuperBowlChamp = "SuperBowlChamp",
  SuperBowlMVP = "SuperBowlMVP",
  RookieOfYear = "RookieOfYear",
}

export enum GamePhase {
  RegularSeason = "RegularSeason",
  Playoffs = "Playoffs",
  OffSeason = "OffSeason",
  Retired = "Retired",
}

// ─── Player & Attributes ──────────────────────────────────────────────────────

export interface Attributes {
  // Shared (all positions)
  speed: number;
  strength: number;
  stamina: number;
  awareness: number;
  // QB
  throwPower: number;
  throwAccuracy: number;
  mobility: number;
  // WR / TE
  catching: number;
  routeRunning: number;
  // RB
  ballCarrying: number;
  elusiveness: number;
  // Defense (LB / CB / S)
  tackle: number;
  coverage: number;
  pursuit: number;
}

export type AttributeKey = keyof Attributes;

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;
  attributes: Attributes;
  ovr: number;
  totalXP: number;
  fame: number;
  legacyPoints: number;
}

export interface Contract {
  yearsRemaining: number;
  salaryPerGame: number;
  signingBonus: number;
  contractTokens: number;
}

// ─── Training ─────────────────────────────────────────────────────────────────

export interface DrillDefinition {
  id: string;
  name: string;
  type: DrillType;
  targetAttribute: AttributeKey;
  baseRatePerSecond: number;
  cost: number;
  unlockSeason: number;
  description: string;
}

export interface ActiveDrill {
  slotIndex: number;
  drillId: string;
  accumulatedTP: number;
  coachMultiplier: number;
}

export interface TrainingState {
  slots: (ActiveDrill | null)[];
  maxSlots: number;
  trainingPoints: number;
}

// ─── Match & Season ───────────────────────────────────────────────────────────

export interface PlayerGameStats {
  // Offense
  passingYards: number;
  passingTDs: number;
  interceptions: number;
  completionPct: number;
  rushingYards: number;
  rushingTDs: number;
  receptions: number;
  receivingYards: number;
  receivingTDs: number;
  // Defense
  tackles: number;
  sacks: number;
  defensiveInterceptions: number;
}

export interface MatchResult {
  week: number;
  season: number;
  opponent: string;
  playerStats: PlayerGameStats;
  teamScore: number;
  opponentScore: number;
  win: boolean;
  xpEarned: number;
  moneyEarned: number;
  fameEarned: number;
  performanceScore: number;
}

export interface SeasonState {
  seasonNumber: number;
  currentWeek: number;
  phase: GamePhase;
  teamRecord: { wins: number; losses: number };
  playoffRound: number | null;
  matchHistory: MatchResult[];
  awardsEarned: AwardType[];
  weekTimer: number;
  gameInProgress: boolean;
  currentOpponent: string | null;
}

// ─── Upgrades & Resources ─────────────────────────────────────────────────────

export type UpgradeEffectType =
  | "drillMultiplier"
  | "matchBonus"
  | "passiveIncome"
  | "slotUnlock"
  | "attributeBonus";

export interface UpgradeEffect {
  type: UpgradeEffectType;
  magnitude: number;
  targetAttribute?: AttributeKey;
  targetDrillType?: DrillType;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  category: UpgradeCategory;
  costPerLevel: number;
  costCurrency: "money" | "contractTokens";
  effect: UpgradeEffect;
  maxLevel: number;
  unlockSeason: number;
  unlockFame: number;
  positions?: Position[]; // undefined = all positions
}

export interface PurchasedUpgrade {
  upgradeId: string;
  level: number;
  purchasedAt: number;
}

export interface Resources {
  money: number;
  trainingPoints: number;
  fame: number;
  contractTokens: number;
  xp: number;
}

// ─── Prestige / Legacy ────────────────────────────────────────────────────────

export interface RetiredPlayerRecord {
  name: string;
  ovr: number;
  seasons: number;
  awards: AwardType[];
}

export interface LegacyState {
  prestigeCount: number;
  permanentTPMultiplier: number;
  permanentMoneyMultiplier: number;
  permanentStartingOVR: number;
  careerAwards: AwardType[];
  retiredPlayers: RetiredPlayerRecord[];
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface GameSettings {
  autoSaveIntervalSeconds: number;
  matchIntervalSeconds: number;
  notificationsEnabled: boolean;
}

// ─── Top-Level Game State ─────────────────────────────────────────────────────

export interface GameState {
  version: number;
  lastSaveTime: number;
  lastTickTime: number;
  player: Player;
  resources: Resources;
  training: TrainingState;
  contract: Contract;
  season: SeasonState;
  purchasedUpgrades: PurchasedUpgrade[];
  unlockedDrills: string[];
  legacy: LegacyState;
  settings: GameSettings;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type PanelName =
  | "dashboard"
  | "training"
  | "matchlog"
  | "upgrades"
  | "career"
  | "prestige"
  | "help";

export interface OfflineSummary {
  tpEarned: number;
  moneyEarned: number;
  matchResults: MatchResult[];
  elapsedSeconds: number;
}
