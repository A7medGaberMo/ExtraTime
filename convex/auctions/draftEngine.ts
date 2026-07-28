import { GenericMutationCtx } from "convex/server";
import { Id } from "../_generated/dataModel";
import { getFormationPositions, MatchSize } from "./formations";
import {
  type Position,
  type Tier,
  TIER_RANK,
  tierRank,
  normalizePosition,
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
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
function matchesExact(playerPosition: string, slot: Position): boolean {
  return playerPositions(playerPosition).includes(slot);
}

function matchesLine(playerPosition: string, slot: Position): boolean {
  const targetLine = lineFor(slot);
  return playerPositions(playerPosition).some((p) => lineFor(p) === targetLine);
}

/** Score how well a player fits a formation slot (0–100). */
function positionFitScore(playerPosition: string, slot: Position): number {
  if (matchesExact(playerPosition, slot)) return 100;
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

// ── Tier Distribution Planning ─────────────────────────────
function planTierBudget(pool: PoolPlayer[], totalSlots: number): Map<Tier, number> {
  // Count available players per tier
  const available = new Map<Tier, number>();
  for (const p of pool) {
    available.set(p.tier, (available.get(p.tier) ?? 0) + 1);
  }

  // Ideal distribution ratios (mains only — subs are flexible)
  const idealRatios: Record<Tier, number> = {
    ICON: 0.08, MASTER: 0.12, ELITE_PLUS: 0.15, ELITE: 0.2,
    GOLD: 0.25, SILVER: 0.12, BRONZE: 0.08,
  };

  const budget = new Map<Tier, number>();
  for (const tier of Object.keys(TIER_RANK) as Tier[]) {
    const ideal = Math.round(totalSlots * idealRatios[tier]);
    const cap = Math.floor((available.get(tier) ?? 0) / 2); // need 2 per slot (main+sub backup)
    budget.set(tier, Math.min(ideal, cap));
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
  const unused = pool.filter((p) => !used.has(p._id));
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

  // Now score SUB candidates (exclude main, prefer 1-2 tiers below)
  const subCandidates = unused.filter((p) => p._id !== main._id);
  const mainRank = tierRank(main.tier);

  const subScores = subCandidates.map((p) => {
    let score = scoreCandidate(p, slot, scoringCtx, "sub");
    // Bonus for being 1-2 tiers below main (creates interesting bidding dynamics)
    const gap = tierRank(p.tier) - mainRank;
    if (gap >= 1 && gap <= 2) score += 40;
    else if (gap === 0) score += 15; // Same tier = competitive
    else if (gap > 3) score -= 20; // Too large a gap is boring
    // Penalize if sub is higher tier than main (feels wrong)
    if (gap < 0) score -= 30;
    return { player: p, score };
  });
  subScores.sort((a, b) => b.score - a.score);

  const topSub = subScores.slice(0, Math.min(5, subScores.length));
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
  ctx: GenericMutationCtx<any>,
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
  const pool = filtered.length >= requiredPlayers ? filtered : (allPlayers.map((p) => ({
    _id: p._id,
    position: p.position,
    tier: p.tier as Tier,
    clubId: p.clubId,
    nationId: p.nationId,
    isLegend: p.isLegend,
  })));

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
      const available = pool.filter((p) => !used.has(p._id));
      const exact = available.filter((p) => matchesExact(p.position, pos)).length;
      return { position: pos, origIdx, scarcity: exact };
    })
    .sort((a, b) => a.scarcity - b.scarcity);

  // Select pairs for each position
  const rawRounds: DraftRound[] = [];
  for (const { position } of positionsByScarcity) {
    const scoringCtx: ScoringContext = { usedClubs, usedNations, tierBudget };
    const [main, sub] = selectSmartPair(pool, used, position, scoringCtx);

    used.add(main._id);
    used.add(sub._id);
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
