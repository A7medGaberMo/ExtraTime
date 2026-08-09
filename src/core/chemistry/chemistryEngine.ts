/**
 * Pure Squad Draft Chemistry Engine
 *
 * Zero imports, zero I/O — the same code runs client-side (UI live preview)
 * and authoritatively inside Convex backend mutations.
 *
 * Model (per Master Architecture Plan):
 *  - Position compatibility matrix: EXACT_MATCH → NATURAL_VARIANT → MISMATCH.
 *  - Club / Nation / League threshold tables (count-based link points).
 *  - ICON: +2 Nation link points to EVERY squad player, self = 3/3 in valid spot.
 *  - HERO: +2 League link points to same-line teammates, +1 Nation to squad,
 *    self = 3/3 in valid spot.
 *  - JOKER: wildcard card that adopts Club/Nation/League of the highest-matching
 *    adjacent neighbor in the formation graph.
 */

export type Tier =
  | "ICON"
  | "HERO"
  | "MASTER"
  | "ELITE_PLUS"
  | "ELITE"
  | "GOLD"
  | "SILVER"
  | "BRONZE";

/** Synthetic OVR bands — fixed per tier (Phase 1 constants). */
export const TIER_SYNTHETIC_OVR: Record<Tier, number> = {
  ICON: 92,
  MASTER: 90,
  ELITE_PLUS: 88,
  ELITE: 86,
  HERO: 85,
  GOLD: 82,
  SILVER: 75,
  BRONZE: 68,
};

export function getSyntheticOVR(tier: Tier): number {
  return TIER_SYNTHETIC_OVR[tier];
}

// ── Position compatibility matrix ──────────────────────────────────

export type PositionFit = "EXACT_MATCH" | "NATURAL_VARIANT" | "MISMATCH";

export const POSITION_FIT_FACTOR: Record<PositionFit, number> = {
  EXACT_MATCH: 1.0,
  NATURAL_VARIANT: 0.8,
  MISMATCH: 0.0,
};

export const POSITION_MAX_CHEM: Record<PositionFit, number> = {
  EXACT_MATCH: 3,
  NATURAL_VARIANT: 2,
  MISMATCH: 0,
};

/** Natural position variants (bidirectional): LB↔LWB, RB↔RWB, ST↔CF, LW↔LM, RW↔RM, CM↔CAM. */
const NATURAL_VARIANTS: Record<string, readonly string[]> = {
  LB: ["LWB"],
  LWB: ["LB"],
  RB: ["RWB"],
  RWB: ["RB"],
  ST: ["CF"],
  CF: ["ST"],
  LW: ["LM"],
  LM: ["LW"],
  RW: ["RM"],
  RM: ["RW"],
  CM: ["CAM"],
  CAM: ["CM"],
};

export function normalizePosition(pos: string): string {
  return pos.trim().toUpperCase();
}

/** All natural positions of a card (supports "CDM/CM" multi-position values). */
export function playerPositions(position: string): string[] {
  return position
    .split("/")
    .map(normalizePosition)
    .filter(Boolean);
}

/**
 * Position normalization layer: evaluates a card against a formation slot.
 * - EXACT_MATCH     → card position equals slot position (Green, fit 1.0, chem 3/3).
 * - NATURAL_VARIANT → card position is a natural variant of the slot (Yellow, fit 0.8, chem 2/3).
 * - MISMATCH        → out of position (Red, fit 0.0, chem 0/3).
 */
export function getPositionMatch(cardPosition: string, slotPosition: string): PositionFit {
  const positions = playerPositions(cardPosition);
  const slot = normalizePosition(slotPosition);
  if (positions.includes(slot)) return "EXACT_MATCH";
  if (positions.some((p) => (NATURAL_VARIANTS[slot] ?? []).includes(p))) return "NATURAL_VARIANT";
  return "MISMATCH";
}

// ── Chemistry threshold tables ─────────────────────────────────────

/**
 * Club thresholds: 2 = 1, 4 = 2, 7 = 3.
 * Nation thresholds: 2 = 1, 5 = 2, 8 = 3.
 * League thresholds: 3 = 1, 5 = 2, 8 = 3.
 * (Count = number of squad players sharing the attribute with the subject.)
 */
const CLUB_THRESHOLDS: ReadonlyArray<readonly [number, number]> = [
  [7, 3], [4, 2], [2, 1],
];
const NATION_THRESHOLDS: ReadonlyArray<readonly [number, number]> = [
  [8, 3], [5, 2], [2, 1],
];
const LEAGUE_THRESHOLDS: ReadonlyArray<readonly [number, number]> = [
  [8, 3], [5, 2], [3, 1],
];

function thresholdChem(count: number, table: ReadonlyArray<readonly [number, number]>): number {
  for (const [need, chem] of table) {
    if (count >= need) return chem;
  }
  return 0;
}

// ── Input / output contracts ────────────────────────────────────────

export interface ChemPlayerInput {
  id: string;
  position: string; // e.g. "CDM/CM"
  tier: Tier;
  clubKey: string; // clubId
  clubName: string;
  nationKey: string;
  nationName: string;
  leagueKey: string; // league of the club (clubs.league)
  isLegend: boolean;
  isHeroFlag: boolean; // precomputed: tier === "HERO"
  isJoker: boolean; // wildcard participation in this draft
}

export interface FormationSlotInput {
  nodes: Array<{ slotIndex: number; position: string; line: "GK" | "DEF" | "MID" | "ATT" }>;
  edges: Array<[number, number]>;
}

export interface JokerResolution {
  playerId: string;
  adoptedClubKey: string;
  adoptedClubName: string;
  adoptedNationKey: string;
  adoptedNationName: string;
  adoptedLeagueKey: string;
  matchedNeighborPlayerId: string;
}

export interface PlayerChemResult {
  playerId: string;
  slotIndex: number;
  positionFit: PositionFit;
  fitnessFactor: number; // 1.0 / 0.8 / 0.0
  maxChem: number; // 3 / 2 / 0
  chem: number; // 0..3 final, position-limited
  clubCount: number;
  nationCount: number;
  leagueCount: number;
  chemBreakdown: { club: number; nation: number; league: number };
  syntheticOvr: number;
  isAutoMaxed: boolean; // icon / hero / joker in valid position
}

export interface ChemistryResult {
  players: PlayerChemResult[];
  totalChem: number; // 0..33 (11 slots × max 3)
  totalOvr: number; // sum of synthetic OVR across squad slots
  jokerResolutions: JokerResolution[];
}

// ── Enriched row (internal) ─────────────────────────────────────────

interface EnrichedRow {
  player: ChemPlayerInput;
  slotIndex: number;
  line: "GK" | "DEF" | "MID" | "ATT";
  clubCount: number;
  nationCount: number;
  leagueCount: number;
}

// ── Pass 1: count aggregation ───────────────────────────────────────

function buildEnriched(
  inputs: ChemPlayerInput[],
  nodes: FormationSlotInput["nodes"]
): EnrichedRow[] {
  const rows: EnrichedRow[] = inputs.map((player, i) => {
    const node = nodes[i];
    return {
      player,
      slotIndex: node?.slotIndex ?? i,
      line: node?.line ?? "DEF",
      clubCount: 0,
      nationCount: 0,
      leagueCount: 0,
    };
  });

  // Pairwise shared-attribute counting (each pair counted once, both directions).
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i].player;
      const b = rows[j].player;
      if (a.clubKey === b.clubKey) {
        rows[i].clubCount++;
        rows[j].clubCount++;
      }
      if (a.nationKey === b.nationKey) {
        rows[i].nationCount++;
        rows[j].nationCount++;
      }
      if (a.leagueKey === b.leagueKey) {
        rows[i].leagueCount++;
        rows[j].leagueCount++;
      }
    }
  }
  return rows;
}

// ── Pass 2: per-player chemistry from thresholds + special boosts ──────

function resolvePlayerChem(
  row: EnrichedRow,
  slotPosition: string,
  rows: EnrichedRow[]
): PlayerChemResult {
  const { player } = row;
  const positionFit = getPositionMatch(player.position, slotPosition);

  const isSpecial = player.tier === "ICON" || player.tier === "HERO" || player.isJoker;
  if (isSpecial && positionFit !== "MISMATCH") {
    return {
      playerId: player.id,
      slotIndex: row.slotIndex,
      positionFit,
      fitnessFactor: POSITION_FIT_FACTOR[positionFit],
      maxChem: POSITION_MAX_CHEM[positionFit],
      chem: 3,
      clubCount: row.clubCount,
      nationCount: row.nationCount,
      leagueCount: row.leagueCount,
      chemBreakdown: { club: 3, nation: 0, league: 0 },
      syntheticOvr: getSyntheticOVR(player.tier),
      isAutoMaxed: true,
    };
  }

  // Special-tier boosts from OTHER squad cards.
  let nationBoost = 0;
  let leagueBoost = 0;
  for (const other of rows) {
    if (other.player.id === player.id) continue;
    if (other.player.tier === "ICON") nationBoost += 2;
    if (other.player.tier === "HERO") {
      nationBoost += 1;
      if (other.line === row.line) leagueBoost += 2;
    }
  }

  const clubChem = thresholdChem(row.clubCount, CLUB_THRESHOLDS);
  const nationChem = thresholdChem(row.nationCount + nationBoost, NATION_THRESHOLDS);
  const leagueChem = thresholdChem(row.leagueCount + leagueBoost, LEAGUE_THRESHOLDS);

  let raw = Math.max(0, Math.min(3, clubChem + nationChem + leagueChem));
  if (positionFit === "MISMATCH") raw = 0;
  else if (positionFit === "NATURAL_VARIANT") raw = Math.min(raw, 2);

  return {
    playerId: player.id,
    slotIndex: row.slotIndex,
    positionFit,
    fitnessFactor: POSITION_FIT_FACTOR[positionFit],
    maxChem: POSITION_MAX_CHEM[positionFit],
    chem: raw,
    clubCount: row.clubCount,
    nationCount: row.nationCount,
    leagueCount: row.leagueCount,
    chemBreakdown: { club: clubChem, nation: nationChem, league: leagueChem },
    syntheticOvr: getSyntheticOVR(player.tier),
    isAutoMaxed: false,
  };
}

// ── Joker wildcard solver ──────────────────────────────────────────────

function adjacentSlots(formation: FormationSlotInput, slotIndex: number): number[] {
  return formation.edges
    .filter(([a, b]) => a === slotIndex || b === slotIndex)
    .map(([a, b]) => (a === slotIndex ? b : a));
}

/**
 * Matching score between a candidate's adopted attributes and another player.
 * Club = 3, Nation = 2, League = 1 — used to rank "highest-matching neighbor".
 */
function attributeMatchScore(
  candidateClub: string,
  candidateNation: string,
  candidateLeague: string,
  other: ChemPlayerInput
): number {
  let s = 0;
  if (candidateClub === other.clubKey) s += 3;
  if (candidateNation === other.nationKey) s += 2;
  if (candidateLeague === other.leagueKey) s += 1;
  return s;
}

/**
 * Lazy graph optimizer: for each Joker card, adopt the Club/Nation/League of the
 * highest-matching adjacent neighbor (best total squad match score, tie → higher
 * synthetic OVR). Deterministic — no randomness, no circular resolution.
 */
export function solveJokerWildcards(
  inputs: ChemPlayerInput[],
  formation: FormationSlotInput
): JokerResolution[] {
  const resolutions: JokerResolution[] = [];
  const jokerIndexes = inputs
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.isJoker);

  for (const { p: joker, i } of jokerIndexes) {
    const slotIndex = formation.nodes[i]?.slotIndex ?? i;
    const neighborIndexes = adjacentSlots(formation, slotIndex).filter((idx) => idx < inputs.length);
    const neighbors = neighborIndexes.map((idx) => inputs[idx]).filter((n) => n.id !== joker.id);

    if (neighbors.length === 0) continue;

    let best: ChemPlayerInput | null = null;
    let bestScore = -1;
    for (const candidate of neighbors) {
      let score = 0;
      for (const other of inputs) {
        if (other.id === joker.id || other.id === candidate.id) continue;
        score += attributeMatchScore(candidate.clubKey, candidate.nationKey, candidate.leagueKey, other);
      }
      if (
        score > bestScore ||
        (score === bestScore &&
          best !== null &&
          getSyntheticOVR(candidate.tier) > getSyntheticOVR(best.tier))
      ) {
        best = candidate;
        bestScore = score;
      }
    }

    if (best) {
      resolutions.push({
        playerId: joker.id,
        adoptedClubKey: best.clubKey,
        adoptedClubName: best.clubName,
        adoptedNationKey: best.nationKey,
        adoptedNationName: best.nationName,
        adoptedLeagueKey: best.leagueKey,
        matchedNeighborPlayerId: best.id,
      });
    }
  }
  return resolutions;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Main solver: resolves joker wildcards, runs the two chemistry passes
 * (1: counts + special boosts, 2: per-player threshold mapping) and returns
 * per-player chemistry, synthetic OVR, and team totals (0–33 / total OVR).
 */
export function calculateSquadChemistry(
  inputs: ChemPlayerInput[],
  formation: FormationSlotInput
): ChemistryResult {
  // Joker adoption pass — wildcard attrs override card attrs for the counts.
  const jokerResolutions = solveJokerWildcards(inputs, formation);
  const adoptedByPlayer = new Map(jokerResolutions.map((r) => [r.playerId, r]));

  const resolvedInputs: ChemPlayerInput[] = inputs.map((p) => {
    const adopted = adoptedByPlayer.get(p.id);
    if (!adopted) return p;
    return {
      ...p,
      clubKey: adopted.adoptedClubKey,
      clubName: adopted.adoptedClubName,
      nationKey: adopted.adoptedNationKey,
      nationName: adopted.adoptedNationName,
      leagueKey: adopted.adoptedLeagueKey,
    };
  });

  // Pass 1 — aggregate counts.
  const rows = buildEnriched(resolvedInputs, formation.nodes);

  // Pass 2 — per-player chemistry.
  const positionBySlot = new Map(formation.nodes.map((n) => [n.slotIndex, n.position]));
  const playerResults = rows.map((row) =>
    resolvePlayerChem(row, positionBySlot.get(row.slotIndex) ?? "", rows)
  );

  const totalChem = playerResults.reduce((sum, r) => sum + r.chem, 0);
  const totalOvr = playerResults.reduce((sum, r) => sum + r.syntheticOvr, 0);

  return { players: playerResults, totalChem, totalOvr, jokerResolutions };
}