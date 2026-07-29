import { GenericMutationCtx } from "convex/server";
import { Id, DataModel } from "../_generated/dataModel";
import { getFormationPositions, MatchSize } from "./formations";
import {
  type Position,
  type Tier,
  TIER_RANK,
  tierRank,
  playerPositions,
  lineFor,
} from "../lib/constants";

// ── Types ──────────────────────────────────────────────────
export type PlayerPoolMode = "GLOBAL" | "EPL" | "ICONS" | string;

export interface DraftRound {
  roundNumber: number;
  position: Position;
  mainPlayerId: Id<"players">;
  subPlayerId: Id<"players">;
  isMysteryRound?: boolean;
}

interface PoolPlayer {
  _id: Id<"players">;
  position: string;
  tier: Tier;
  clubId: Id<"clubs">;
  nationId: Id<"nations">;
  isLegend: boolean;
}

// ── Utilities ──────────────────────────────────────────────
function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return items[Math.floor(Math.random() * items.length)];
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Position Matching ──────────────────────────────────────
const LEFT_POSITIONS = new Set(["LB", "LWB", "LM", "LW"]);
const RIGHT_POSITIONS = new Set(["RB", "RWB", "RM", "RW"]);
const CENTER_POSITIONS = new Set(["GK", "CB", "CDM", "CM", "CAM", "ST", "CF"]);

function matchesExact(playerPosition: string, slot: Position): boolean {
  return playerPositions(playerPosition).includes(slot);
}

function isSideCompatible(playerPosition: string, slot: Position): boolean {
  const pPositions = playerPositions(playerPosition);
  
  // Exact match is always compatible
  if (pPositions.includes(slot)) return true;

  // Left-sided slot: player MUST have a Left or Center position (cannot be purely Right-sided)
  if (LEFT_POSITIONS.has(slot)) {
    return pPositions.some((p) => LEFT_POSITIONS.has(p) || CENTER_POSITIONS.has(p));
  }

  // Right-sided slot: player MUST have a Right or Center position (cannot be purely Left-sided)
  if (RIGHT_POSITIONS.has(slot)) {
    return pPositions.some((p) => RIGHT_POSITIONS.has(p) || CENTER_POSITIONS.has(p));
  }

  return true;
}

function matchesLine(playerPosition: string, slot: Position): boolean {
  if (!isSideCompatible(playerPosition, slot)) return false;
  const targetLine = lineFor(slot);
  return playerPositions(playerPosition).some((p) => lineFor(p) === targetLine);
}

/** Score how well a player fits a formation slot (0–100). */
function positionFitScore(playerPosition: string, slot: Position): number {
  if (matchesExact(playerPosition, slot)) return 100;

  // Strict side incompatibility penalty (LB cannot play RB/RW, RB cannot play LB/LW)
  if (!isSideCompatible(playerPosition, slot)) return 0;

  if (matchesLine(playerPosition, slot)) return 55;
  // Adjacent-line partial credit
  const pLines = playerPositions(playerPosition).map(lineFor);
  const target = lineFor(slot);
  const adjacency: Record<string, string[]> = {
    GK: ["DEF"],
    DEF: ["GK", "MID"],
    MID: ["DEF", "ATT"],
    ATT: ["MID"],
  };
  if (pLines.some((l) => adjacency[target]?.includes(l))) return 25;
  return 5;
}

// ── Smart Candidate Scoring ────────────────────────────────
interface ScoringContext {
  usedClubs: Map<string, number>;
  usedNations: Map<string, number>;
  tierBudget: Map<Tier, number>; // how many more of this tier we want
}

function scoreCandidate(
  player: PoolPlayer,
  slot: Position,
  ctx: ScoringContext,
  role: "main" | "sub"
): number {
  let score = 0;

  // 1. Position fit (0–100, heavily weighted)
  score += positionFitScore(player.position, slot) * 3;

  // 2. Tier preference — favor higher tiers for main, lower for sub
  const rank = tierRank(player.tier);
  if (role === "main") {
    score += Math.max(0, (6 - rank) * 15); // ICONs get 90, BRONZE gets 0
  } else {
    // Subs should be decent but not top-tier (sweet spot: GOLD-SILVER range)
    const subIdeal = 4; // GOLD
    score += Math.max(0, 40 - Math.abs(rank - subIdeal) * 12);
  }

  // 3. Tier budget bonus — favor tiers we still need
  const remaining = ctx.tierBudget.get(player.tier) ?? 0;
  if (remaining > 0) score += 30;

  // 4. Club diversity penalty
  const clubCount = ctx.usedClubs.get(player.clubId) ?? 0;
  score -= clubCount * 25;

  // 5. Nation diversity (mild penalty)
  const nationCount = ctx.usedNations.get(player.nationId) ?? 0;
  score -= nationCount * 8;

  return Math.max(0, score);
}

const TOP_CLUB_NAMES = new Set([
  "Real Madrid", "Barcelona", "Barca", "Atlético Madrid", "Atletico Madrid",
  "Manchester City", "Man City", "Arsenal", "Liverpool", "Manchester United", "Man Utd", "Chelsea", "Tottenham",
  "Bayern Munich", "Bayern", "Borussia Dortmund", "Dortmund", "Bayer Leverkusen", "Leverkusen",
  "Paris Saint-Germain", "PSG",
  "AC Milan", "Inter Milan", "Inter", "Juventus", "Juve", "Napoli",
]);

// ── Tier Distribution Planning ─────────────────────────────
function planTierBudget(pool: PoolPlayer[], totalSlots: number): Map<Tier, number> {
  const available = new Map<Tier, number>();
  let totalAvailable = 0;
  for (const p of pool) {
    available.set(p.tier, (available.get(p.tier) ?? 0) + 1);
    totalAvailable++;
  }

  // Dynamic ratio weights based on actual database tier proportions
  const targetRatios: Record<Tier, number> = {
    ICON: Math.min(0.25, ((available.get("ICON") ?? 0) / (totalAvailable || 1)) * 1.6),
    MASTER: Math.min(0.25, ((available.get("MASTER") ?? 0) / (totalAvailable || 1)) * 1.4),
    ELITE_PLUS: Math.min(0.25, ((available.get("ELITE_PLUS") ?? 0) / (totalAvailable || 1)) * 1.3),
    ELITE: Math.min(0.20, ((available.get("ELITE") ?? 0) / (totalAvailable || 1)) * 1.1),
    GOLD: Math.min(0.12, ((available.get("GOLD") ?? 0) / (totalAvailable || 1)) * 0.7),
    SILVER: Math.min(0.03, ((available.get("SILVER") ?? 0) / (totalAvailable || 1)) * 0.3),
    BRONZE: Math.min(0.02, ((available.get("BRONZE") ?? 0) / (totalAvailable || 1)) * 0.2),
  };

  const budget = new Map<Tier, number>();
  for (const tier of Object.keys(TIER_RANK) as Tier[]) {
    const ideal = Math.round(totalSlots * (targetRatios[tier] || 0.1));
    const cap = Math.floor((available.get(tier) ?? 0) / 2);
    budget.set(tier, Math.max(0, Math.min(ideal, cap)));
  }
  return budget;
}

// ── Smart Pair Selection ───────────────────────────────────
function selectSmartPair(
  pool: PoolPlayer[],
  used: Set<string>,
  slot: Position,
  scoringCtx: ScoringContext
): [PoolPlayer, PoolPlayer] {
  const unused = pool.filter((p) => !used.has(String(p._id)));
  if (unused.length < 2) {
    throw new Error(`Not enough players for position ${slot}. Only ${unused.length} left.`);
  }

  // Score all candidates for MAIN role
  const mainScores = unused.map((p) => ({
    player: p,
    score: scoreCandidate(p, slot, scoringCtx, "main"),
  }));
  mainScores.sort((a, b) => b.score - a.score);

  // Pick main from top candidates (weighted random from top 6 for variety)
  const topMain = mainScores.slice(0, Math.min(6, mainScores.length));
  const mainWeights = topMain.map((c) => Math.max(1, c.score));
  const main = weightedPick(topMain, mainWeights).player;

  // Now score SUB candidates (exclude main player)
  const subCandidates = unused.filter((p) => p._id !== main._id);
  const mainRank = tierRank(main.tier);

  // 55:45 ratio — 55% chance sub is lower tier, 45% chance sub is equal or higher tier!
  const isEqualOrHigherRoll = Math.random() < 0.45;

  const subScores = subCandidates.map((p) => {
    let score = scoreCandidate(p, slot, scoringCtx, "sub");
    const pRank = tierRank(p.tier);
    const gap = pRank - mainRank; // Positive = lower tier than main, Negative = higher tier than main

    if (isEqualOrHigherRoll) {
      // 45% Archetype: Equal or Higher Tier Sub (Same tier clash or higher tier jackpot)
      if (gap <= 0) score += 50;
      else score -= 15;
    } else {
      // 55% Archetype: Lower Tier Sub (Standard risk/reward)
      if (gap >= 1 && gap <= 2) score += 50;
      else if (gap > 2) score += 25;
      else score -= 15;
    }
    return { player: p, score };
  });
  subScores.sort((a, b) => b.score - a.score);

  const topSub = subScores.slice(0, Math.min(6, subScores.length));
  const subWeights = topSub.map((c) => Math.max(1, c.score));
  const sub = weightedPick(topSub, subWeights).player;

  return [main, sub];
}

// ── Dramatic Round Ordering ────────────────────────────────
function orderForDrama(rounds: DraftRound[], pool: PoolPlayer[]): DraftRound[] {
  const playerMap = new Map(pool.map((p) => [p._id as string, p]));

  // Order rounds by tactical position rank: GK -> DEF -> MID -> ST
  const POSITION_RANK: Record<string, number> = {
    GK: 1,
    LB: 2, CB: 2, RB: 2, LWB: 2, RWB: 2,
    CDM: 3, CM: 3, CAM: 3, LM: 3, RM: 3,
    LW: 4, RW: 4, ST: 4, CF: 4,
  };

  const sortedByPosition = [...rounds].sort((a, b) => {
    const rankA = POSITION_RANK[a.position] || 5;
    const rankB = POSITION_RANK[b.position] || 5;
    if (rankA !== rankB) return rankA - rankB;
    // Tie-break by main player tier rank for exciting variety within line
    const tierA = tierRank(playerMap.get(a.mainPlayerId as string)?.tier);
    const tierB = tierRank(playerMap.get(b.mainPlayerId as string)?.tier);
    return tierA - tierB;
  });

  return sortedByPosition.map((round, idx) => ({
    ...round,
    roundNumber: idx + 1,
  }));
}

// ── Strategic Mystery Placement ────────────────────────────
function assignMysteryRounds(rounds: DraftRound[], pool: PoolPlayer[]): DraftRound[] {
  const playerMap = new Map(pool.map((p) => [p._id as string, p]));
  const n = rounds.length;
  const mysteryCount = Math.max(1, Math.round(n * 0.18)); // ~18% mystery

  // Score rounds for mystery worthiness (higher tier = more dramatic mystery)
  const candidates = rounds
    .map((r, idx) => ({
      idx,
      tier: tierRank(playerMap.get(r.mainPlayerId as string)?.tier),
    }))
    .filter((c) => c.idx > 0 && c.idx < n - 1) // Never first or last
    .sort((a, b) => a.tier - b.tier); // Best tiers first (more dramatic)

  const mysteryIdxs = new Set<number>();
  for (const c of candidates) {
    if (mysteryIdxs.size >= mysteryCount) break;
    // No consecutive mysteries
    if (mysteryIdxs.has(c.idx - 1) || mysteryIdxs.has(c.idx + 1)) continue;
    mysteryIdxs.add(c.idx);
  }

  return rounds.map((r, idx) => ({
    ...r,
    isMysteryRound: mysteryIdxs.has(idx),
  }));
}

// ── Main Entry Point ───────────────────────────────────────
export async function generateDraftRounds(
  ctx: GenericMutationCtx<DataModel>,
  formation: string,
  matchSize: MatchSize,
  poolMode: PlayerPoolMode
): Promise<DraftRound[]> {
  const formationPositions = getFormationPositions(formation, matchSize);
  const allPlayers = await ctx.db.query("players").collect();
  const clubs = await ctx.db.query("clubs").collect();
  const clubById = new Map(clubs.map((c) => [c._id, c]));

  // Filter player pool by mode
  const filtered: PoolPlayer[] = allPlayers
    .filter((player) => {
      if (poolMode === "ICONS") return player.isLegend || player.tier === "ICON";
      if (poolMode === "EPL") return clubById.get(player.clubId)?.league === "Premier League";
      if (poolMode === "TOP_TEAMS") {
        const clubName = clubById.get(player.clubId)?.name ?? "";
        return TOP_CLUB_NAMES.has(clubName) || player.isLegend || player.tier === "ICON";
      }
      return true; // GLOBAL
    })
    .map((p) => ({
      _id: p._id,
      position: p.position,
      tier: p.tier as Tier,
      clubId: p.clubId,
      nationId: p.nationId,
      isLegend: p.isLegend,
    }));

  const requiredPlayers = formationPositions.length * 2;
  const mappedAll: PoolPlayer[] = allPlayers.map((p) => ({
    _id: p._id,
    position: p.position,
    tier: p.tier as Tier,
    clubId: p.clubId,
    nationId: p.nationId,
    isLegend: p.isLegend,
  }));

  let pool: PoolPlayer[] = [...filtered];
  if (pool.length < requiredPlayers) {
    const existingIds = new Set(pool.map((p) => p._id));
    const extra = mappedAll.filter((p) => !existingIds.has(p._id));
    pool = [...pool, ...extra];
  }

  if (pool.length < requiredPlayers) {
    throw new Error(
      `Not enough players for ${matchSize}P Hidden Bid (need ${requiredPlayers}, have ${pool.length}).`
    );
  }

  // Plan tier distribution
  const tierBudget = planTierBudget(pool, formationPositions.length);
  const used = new Set<string>();
  const usedClubs = new Map<string, number>();
  const usedNations = new Map<string, number>();

  // Sort positions by scarcity (hardest to fill first)
  const positionsByScarcity = formationPositions
    .map((pos, origIdx) => {
      const available = pool.filter((p) => !used.has(String(p._id)));
      const exact = available.filter((p) => matchesExact(p.position, pos)).length;
      return { position: pos, origIdx, scarcity: exact };
    })
    .sort((a, b) => a.scarcity - b.scarcity);

  // Select pairs for each position
  const rawRounds: DraftRound[] = [];
  for (const { position } of positionsByScarcity) {
    const scoringCtx: ScoringContext = { usedClubs, usedNations, tierBudget };
    const [main, sub] = selectSmartPair(pool, used, position, scoringCtx);

    used.add(String(main._id));
    used.add(String(sub._id));
    usedClubs.set(main.clubId, (usedClubs.get(main.clubId) ?? 0) + 1);
    usedClubs.set(sub.clubId, (usedClubs.get(sub.clubId) ?? 0) + 1);
    usedNations.set(main.nationId, (usedNations.get(main.nationId) ?? 0) + 1);
    usedNations.set(sub.nationId, (usedNations.get(sub.nationId) ?? 0) + 1);

    // Decrement tier budget
    const remaining = tierBudget.get(main.tier) ?? 0;
    if (remaining > 0) tierBudget.set(main.tier, remaining - 1);

    rawRounds.push({
      roundNumber: 0, // will be reassigned
      position,
      mainPlayerId: main._id,
      subPlayerId: sub._id,
    });
  }

  // Order rounds for dramatic arc, then assign mystery rounds
  const ordered = orderForDrama(rawRounds, pool);
  return assignMysteryRounds(ordered, pool);
}
