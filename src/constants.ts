import {
  Position,
  DrillType,
  UpgradeCategory,
  type AttributeKey,
  type DrillDefinition,
  type UpgradeDefinition,
  type Attributes,
  type Player,
} from "./types.js";

// ─── OVR Weights ──────────────────────────────────────────────────────────────

type WeightMap = Partial<Record<AttributeKey, number>>;

export const OVR_WEIGHTS: Record<Position, WeightMap> = {
  [Position.QB]: {
    throwAccuracy: 0.30,
    throwPower: 0.20,
    awareness: 0.20,
    mobility: 0.15,
    speed: 0.10,
    stamina: 0.05,
  },
  [Position.WR]: {
    speed: 0.30,
    catching: 0.30,
    routeRunning: 0.25,
    stamina: 0.10,
    awareness: 0.05,
  },
  [Position.TE]: {
    catching: 0.25,
    strength: 0.20,
    routeRunning: 0.20,
    speed: 0.15,
    stamina: 0.10,
    awareness: 0.10,
  },
  [Position.RB]: {
    speed: 0.25,
    elusiveness: 0.25,
    ballCarrying: 0.20,
    strength: 0.15,
    stamina: 0.10,
    awareness: 0.05,
  },
  [Position.LB]: {
    tackle: 0.30,
    pursuit: 0.25,
    strength: 0.20,
    awareness: 0.15,
    stamina: 0.10,
  },
  [Position.CB]: {
    coverage: 0.35,
    speed: 0.30,
    awareness: 0.20,
    tackle: 0.10,
    stamina: 0.05,
  },
  [Position.S]: {
    coverage: 0.25,
    awareness: 0.25,
    speed: 0.20,
    tackle: 0.20,
    stamina: 0.10,
  },
};

export function computeOVR(player: Player): number {
  const weights = OVR_WEIGHTS[player.position];
  let total = 0;
  let weightSum = 0;
  for (const [attr, weight] of Object.entries(weights)) {
    if (weight === undefined) continue;
    const val = player.attributes[attr as AttributeKey] ?? 50;
    total += val * weight;
    weightSum += weight;
  }
  if (weightSum === 0) return 50;
  return Math.round(Math.min(99, Math.max(40, total / weightSum)));
}

// ─── Position Display Names ───────────────────────────────────────────────────

export const POSITION_LABELS: Record<Position, string> = {
  [Position.QB]: "Quarterback",
  [Position.RB]: "Running Back",
  [Position.WR]: "Wide Receiver",
  [Position.TE]: "Tight End",
  [Position.LB]: "Linebacker",
  [Position.CB]: "Cornerback",
  [Position.S]: "Safety",
};

// ─── Starting Attributes ──────────────────────────────────────────────────────

export function getStartingAttributes(position: Position, legacyBonus: number): Attributes {
  const base = 40 + legacyBonus;
  const attrs: Attributes = {
    speed: base,
    strength: base,
    stamina: base,
    awareness: base,
    throwPower: base,
    throwAccuracy: base,
    mobility: base,
    catching: base,
    routeRunning: base,
    ballCarrying: base,
    elusiveness: base,
    tackle: base,
    coverage: base,
    pursuit: base,
  };
  // Give a slight head start on position-relevant stats
  const weights = OVR_WEIGHTS[position];
  for (const [attr, weight] of Object.entries(weights)) {
    if (weight === undefined) continue;
    (attrs[attr as AttributeKey] as number) = Math.round(base + weight * 20);
  }
  return attrs;
}

// ─── Attribute Upgrade Cost ───────────────────────────────────────────────────

export const ATTRIBUTE_BASE_COSTS: Partial<Record<AttributeKey, number>> = {
  speed: 15,
  strength: 12,
  stamina: 10,
  awareness: 20,
  throwPower: 14,
  throwAccuracy: 18,
  mobility: 13,
  catching: 14,
  routeRunning: 16,
  ballCarrying: 13,
  elusiveness: 15,
  tackle: 13,
  coverage: 16,
  pursuit: 12,
};

export function attributeUpgradeCost(attribute: AttributeKey, currentLevel: number): number {
  const base = ATTRIBUTE_BASE_COSTS[attribute] ?? 15;
  return Math.floor(base * Math.pow(1.15, currentLevel - 40));
}

// ─── Drill Definitions ────────────────────────────────────────────────────────

export const DRILL_DEFINITIONS: DrillDefinition[] = [
  {
    id: "sprint_track",
    name: "Track Sprints",
    type: DrillType.Sprint,
    targetAttribute: "speed",
    baseRatePerSecond: 0.5,
    cost: 0,
    unlockSeason: 0,
    description: "Run timed 40-yard dashes to build explosive speed.",
  },
  {
    id: "weight_room_basic",
    name: "Weight Room",
    type: DrillType.WeightRoom,
    targetAttribute: "strength",
    baseRatePerSecond: 0.4,
    cost: 0,
    unlockSeason: 0,
    description: "Core lifts to build functional strength.",
  },
  {
    id: "film_study",
    name: "Film Study",
    type: DrillType.FilmStudy,
    targetAttribute: "awareness",
    baseRatePerSecond: 0.35,
    cost: 0,
    unlockSeason: 0,
    description: "Watch game tape to understand opposing defenses.",
  },
  {
    id: "agility_ladder",
    name: "Agility Ladder",
    type: DrillType.Agility,
    targetAttribute: "elusiveness",
    baseRatePerSecond: 0.4,
    cost: 500,
    unlockSeason: 1,
    description: "Ladder drills to sharpen lateral quickness.",
  },
  {
    id: "route_running_cones",
    name: "Cone Routes",
    type: DrillType.RouteRunning,
    targetAttribute: "routeRunning",
    baseRatePerSecond: 0.45,
    cost: 750,
    unlockSeason: 1,
    description: "Run precise routes around cones to perfect timing.",
  },
  {
    id: "throwing_mechanics",
    name: "QB Mechanics",
    type: DrillType.ThrowingMechanics,
    targetAttribute: "throwAccuracy",
    baseRatePerSecond: 0.5,
    cost: 0,
    unlockSeason: 0,
    description: "Work on footwork and release mechanics.",
  },
  {
    id: "coverage_drills",
    name: "DB Coverage",
    type: DrillType.Coverage,
    targetAttribute: "coverage",
    baseRatePerSecond: 0.45,
    cost: 600,
    unlockSeason: 1,
    description: "Mirror drills and zone coverage assignments.",
  },
  {
    id: "playbook_study",
    name: "Playbook Study",
    type: DrillType.PlaybookStudy,
    targetAttribute: "awareness",
    baseRatePerSecond: 0.6,
    cost: 1000,
    unlockSeason: 2,
    description: "Deep playbook memorization to read plays faster.",
  },
  {
    id: "blocking_tech",
    name: "Blocking Tech",
    type: DrillType.BlockingTechnique,
    targetAttribute: "strength",
    baseRatePerSecond: 0.55,
    cost: 800,
    unlockSeason: 2,
    description: "Hand placement and leverage techniques.",
  },
  {
    id: "endurance_camp",
    name: "Endurance Camp",
    type: DrillType.Sprint,
    targetAttribute: "stamina",
    baseRatePerSecond: 0.4,
    cost: 500,
    unlockSeason: 1,
    description: "Long-distance runs and conditioning circuits.",
  },
  {
    id: "throw_power_training",
    name: "Arm Strength",
    type: DrillType.ThrowingMechanics,
    targetAttribute: "throwPower",
    baseRatePerSecond: 0.45,
    cost: 1500,
    unlockSeason: 3,
    description: "Resistance band throws to build arm strength.",
  },
  {
    id: "hands_camp",
    name: "Hands Camp",
    type: DrillType.RouteRunning,
    targetAttribute: "catching",
    baseRatePerSecond: 0.5,
    cost: 1200,
    unlockSeason: 2,
    description: "JUGS machine reps to soften hands.",
  },
  // Defense-specific drills
  {
    id: "tackle_circuit",
    name: "Tackle Circuit",
    type: DrillType.WeightRoom,
    targetAttribute: "tackle",
    baseRatePerSecond: 0.5,
    cost: 0,
    unlockSeason: 0,
    description: "Pad drills and wrap-up technique to improve tackling fundamentals.",
  },
  {
    id: "pursuit_drills",
    name: "Pursuit Drills",
    type: DrillType.Sprint,
    targetAttribute: "pursuit",
    baseRatePerSecond: 0.45,
    cost: 400,
    unlockSeason: 1,
    description: "Angle pursuit training to cut off ball carriers and run down plays.",
  },
];

export const DRILL_BY_ID: Record<string, DrillDefinition> = Object.fromEntries(
  DRILL_DEFINITIONS.map((d) => [d.id, d])
);

// ─── Default Starting Drills by Position ─────────────────────────────────────

export function getStartingDrillIds(position: Position): string[] {
  // Defense positions swap out the generic shared drills for position-relevant ones
  const positionDrills: Record<Position, string[]> = {
    [Position.QB]: ["sprint_track", "weight_room_basic", "film_study", "throwing_mechanics"],
    [Position.WR]: ["sprint_track", "weight_room_basic", "film_study", "route_running_cones"],
    [Position.TE]: ["sprint_track", "weight_room_basic", "film_study", "route_running_cones"],
    [Position.RB]: ["sprint_track", "weight_room_basic", "film_study", "agility_ladder"],
    [Position.LB]: ["tackle_circuit", "weight_room_basic", "film_study", "endurance_camp"],
    [Position.CB]: ["tackle_circuit", "sprint_track", "film_study", "coverage_drills"],
    [Position.S]: ["tackle_circuit", "sprint_track", "film_study", "coverage_drills"],
  };
  return positionDrills[position] ?? ["sprint_track", "weight_room_basic", "film_study"];
}

// ─── Upgrade Definitions ──────────────────────────────────────────────────────

export const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  // Equipment
  {
    id: "cleats_basic",
    name: "Pro Cleats",
    description: "High-traction cleats that improve on-field performance.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 2000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 1.5 },
    maxLevel: 3,
    unlockSeason: 0,
    unlockFame: 0,
  },
  {
    id: "gloves",
    name: "Receiver Gloves",
    description: "Sticky gloves that boost catching consistency.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 1500,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 2, targetAttribute: "catching" },
    maxLevel: 3,
    unlockSeason: 0,
    unlockFame: 0,
  },
  {
    id: "helmet_pro",
    name: "Pro Helmet",
    description: "Reduces fatigue, improving stamina in tough games.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 3000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 2, targetAttribute: "stamina" },
    maxLevel: 3,
    unlockSeason: 1,
    unlockFame: 10,
  },
  // Coaches
  {
    id: "qb_coach",
    name: "QB Coach",
    description: "Expert coach that boosts throwing drill speed by 25%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 5000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.25, targetDrillType: DrillType.ThrowingMechanics },
    maxLevel: 3,
    unlockSeason: 1,
    unlockFame: 20,
    positions: [Position.QB],
  },
  {
    id: "speed_coach",
    name: "Speed Coach",
    description: "Specialized sprint coach that boosts sprint drill speed by 25%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 5000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.25, targetDrillType: DrillType.Sprint },
    maxLevel: 3,
    unlockSeason: 1,
    unlockFame: 20,
  },
  {
    id: "extra_slot",
    name: "Extra Drill Slot",
    description: "Unlock an additional training drill slot.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "slotUnlock", magnitude: 1 },
    maxLevel: 2,
    unlockSeason: 2,
    unlockFame: 50,
  },
  // Diet
  {
    id: "nutrition_plan",
    name: "Nutrition Plan",
    description: "Optimized diet that boosts all training rates by 15%.",
    category: UpgradeCategory.Diet,
    costPerLevel: 4000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.15 },
    maxLevel: 3,
    unlockSeason: 1,
    unlockFame: 30,
  },
  // Endorsements
  {
    id: "local_sponsor",
    name: "Local Sponsor",
    description: "A local business deal that pays $100/min passively.",
    category: UpgradeCategory.Endorsement,
    costPerLevel: 3000,
    costCurrency: "money",
    effect: { type: "passiveIncome", magnitude: 100 / 60 },
    maxLevel: 3,
    unlockSeason: 1,
    unlockFame: 15,
  },
  {
    id: "national_deal",
    name: "National Deal",
    description: "A national brand deal paying $500/min passively.",
    category: UpgradeCategory.Endorsement,
    costPerLevel: 20000,
    costCurrency: "money",
    effect: { type: "passiveIncome", magnitude: 500 / 60 },
    maxLevel: 5,
    unlockSeason: 3,
    unlockFame: 100,
  },

  // ── Tier 2 General (Season 2–3) ───────────────────────────────────────────
  {
    id: "recovery_pool",
    name: "Recovery Pool",
    description: "Ice baths and cryotherapy protocols — boosts Stamina permanently.",
    category: UpgradeCategory.Diet,
    costPerLevel: 6000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 2, targetAttribute: "stamina" },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 30,
  },
  {
    id: "film_suite",
    name: "Advanced Film Suite",
    description: "High-end film technology that boosts Film Study drill speed by 30%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.30, targetDrillType: DrillType.FilmStudy },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 30,
  },
  {
    id: "regional_sponsor",
    name: "Regional Sponsor",
    description: "A regional brand partnership paying $250/min passively.",
    category: UpgradeCategory.Endorsement,
    costPerLevel: 10000,
    costCurrency: "money",
    effect: { type: "passiveIncome", magnitude: 250 / 60 },
    maxLevel: 3,
    unlockSeason: 3,
    unlockFame: 50,
  },

  // ── Tier 3 General (Season 5–6) ───────────────────────────────────────────
  {
    id: "elite_equipment",
    name: "Elite Equipment Set",
    description: "Professional-grade gear used by the top 1% of players. Significant match performance bonus.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 20000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 3 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
  },
  {
    id: "performance_analyst",
    name: "Performance Analyst",
    description: "A full-time data scientist tracking every rep. Boosts all drill rates by 15%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 25000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.15 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
  },
  {
    id: "signature_endorsement",
    name: "Signature Endorsement",
    description: "Your own signature line generating $600/min passively.",
    category: UpgradeCategory.Endorsement,
    costPerLevel: 75000,
    costCurrency: "money",
    effect: { type: "passiveIncome", magnitude: 600 / 60 },
    maxLevel: 3,
    unlockSeason: 6,
    unlockFame: 250,
  },

  // ── Tier 4 General (Season 8–10) ─────────────────────────────────────────
  {
    id: "personal_trainer",
    name: "Personal Performance Coach",
    description: "A full-time live-in coach on staff. All drill rates +25%.",
    category: UpgradeCategory.Diet,
    costPerLevel: 100000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.25 },
    maxLevel: 2,
    unlockSeason: 8,
    unlockFame: 400,
  },
  {
    id: "hof_preparation",
    name: "Hall of Fame Gear",
    description: "The absolute pinnacle of equipment. Meaningful match performance bonus.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 200000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 6 },
    maxLevel: 1,
    unlockSeason: 10,
    unlockFame: 600,
  },
  {
    id: "mega_deal",
    name: "Mega Endorsement Deal",
    description: "A generational endorsement deal paying $5,000/min passively.",
    category: UpgradeCategory.Endorsement,
    costPerLevel: 250000,
    costCurrency: "money",
    effect: { type: "passiveIncome", magnitude: 5000 / 60 },
    maxLevel: 3,
    unlockSeason: 10,
    unlockFame: 600,
  },

  // ── QB Specialist ─────────────────────────────────────────────────────────
  {
    id: "qb_elite_coaching",
    name: "Elite QB Coaching",
    description: "Position-specific coaching on footwork and release. Throwing drill speed +40%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.40, targetDrillType: DrillType.ThrowingMechanics },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.QB],
  },
  {
    id: "pocket_presence",
    name: "Pocket Presence Training",
    description: "Reading the rush and extending plays — boosts Throw Accuracy permanently.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 10000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 2, targetAttribute: "throwAccuracy" },
    maxLevel: 3,
    unlockSeason: 3,
    unlockFame: 50,
    positions: [Position.QB],
  },
  {
    id: "qb_mentor",
    name: "QB Mentor Program",
    description: "A legendary QB mentors your mechanics and IQ. All drill rates +30%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 40000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.30 },
    maxLevel: 3,
    unlockSeason: 6,
    unlockFame: 200,
    positions: [Position.QB],
  },

  // ── WR / TE Specialist ────────────────────────────────────────────────────
  {
    id: "receiver_route_coach",
    name: "Route Running Coach",
    description: "NFL route specialist breaks down every stem and break. Route Running drill +40%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.40, targetDrillType: DrillType.RouteRunning },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.WR, Position.TE],
  },
  {
    id: "hands_specialist",
    name: "Hands Specialist",
    description: "Elite catching drills to eliminate drops. Boosts Catching permanently.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 7000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 3, targetAttribute: "catching" },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.WR, Position.TE],
  },
  {
    id: "elite_receiver_program",
    name: "Elite Receiver Camp",
    description: "Exclusive camp with top receiving coaches. Major match performance boost.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 30000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 4 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
    positions: [Position.WR, Position.TE],
  },

  // ── RB Specialist ─────────────────────────────────────────────────────────
  {
    id: "rb_vision_coach",
    name: "Vision Training Coach",
    description: "Train to read blocking schemes and find running lanes. Film Study drill +40%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.40, targetDrillType: DrillType.FilmStudy },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.RB],
  },
  {
    id: "agility_specialist",
    name: "Agility Specialist",
    description: "One-cut and juke training to make defenders miss. Boosts Elusiveness permanently.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 7000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 3, targetAttribute: "elusiveness" },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.RB],
  },
  {
    id: "elite_rb_program",
    name: "Elite RB Camp",
    description: "Exclusive camp with former all-pro backs. Major match performance boost.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 30000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 4 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
    positions: [Position.RB],
  },

  // ── LB Specialist ─────────────────────────────────────────────────────────
  {
    id: "pass_rush_coach",
    name: "Pass Rush Coach",
    description: "Specialized blitz packages and edge rush techniques. Weight Room drill +40%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.40, targetDrillType: DrillType.WeightRoom },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.LB],
  },
  {
    id: "lb_instincts",
    name: "Linebacker Instincts",
    description: "Reaction and pursuit angle training. Boosts Tackle permanently.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 7000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 3, targetAttribute: "tackle" },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.LB],
  },
  {
    id: "elite_lb_program",
    name: "Elite Linebacker Camp",
    description: "Train with the best defensive minds in football. Major match performance boost.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 30000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 4 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
    positions: [Position.LB],
  },

  // ── CB / S Specialist ─────────────────────────────────────────────────────
  {
    id: "coverage_specialist",
    name: "Coverage Specialist",
    description: "Press, zone, and man coverage training with elite DB coaches. Coverage drill +40%.",
    category: UpgradeCategory.Coach,
    costPerLevel: 8000,
    costCurrency: "money",
    effect: { type: "drillMultiplier", magnitude: 0.40, targetDrillType: DrillType.Coverage },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.CB, Position.S],
  },
  {
    id: "db_instincts",
    name: "DB Instincts Training",
    description: "Ball tracking and route recognition drills. Boosts Coverage permanently.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 7000,
    costCurrency: "money",
    effect: { type: "attributeBonus", magnitude: 3, targetAttribute: "coverage" },
    maxLevel: 3,
    unlockSeason: 2,
    unlockFame: 25,
    positions: [Position.CB, Position.S],
  },
  {
    id: "elite_db_program",
    name: "Elite DB Camp",
    description: "Shutdown corner and center field training with legendary DBs. Major match performance boost.",
    category: UpgradeCategory.Equipment,
    costPerLevel: 30000,
    costCurrency: "money",
    effect: { type: "matchBonus", magnitude: 4 },
    maxLevel: 3,
    unlockSeason: 5,
    unlockFame: 150,
    positions: [Position.CB, Position.S],
  },
];

export const UPGRADE_BY_ID: Record<string, UpgradeDefinition> = Object.fromEntries(
  UPGRADE_DEFINITIONS.map((u) => [u.id, u])
);

// ─── NFL Team Names (for opponents) ──────────────────────────────────────────

export const NFL_TEAM_NAMES = [
  "Cardinals", "Falcons", "Ravens", "Bills", "Panthers", "Bears",
  "Bengals", "Browns", "Cowboys", "Broncos", "Lions", "Packers",
  "Texans", "Colts", "Jaguars", "Chiefs", "Raiders", "Chargers",
  "Rams", "Dolphins", "Vikings", "Patriots", "Saints", "Giants",
  "Jets", "Eagles", "Steelers", "49ers", "Seahawks", "Buccaneers",
  "Titans", "Commanders",
];

// ─── Number Formatting ────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "K";
  return Math.floor(n).toLocaleString();
}

export function formatMoney(n: number): string {
  return "$" + formatNumber(n);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

// ─── Game Constants ───────────────────────────────────────────────────────────

export const SAVE_VERSION = 2;
export const REGULAR_SEASON_WEEKS = 17;
export const GAME_DURATION_SECONDS = 17;
export const PLAYOFF_TEAMS = 7;
export const PLAYER_STARTING_AGE = 22;
export const OFFLINE_CAP_HOURS = 8;
export const OFFLINE_TP_EFFICIENCY = 0.5;
