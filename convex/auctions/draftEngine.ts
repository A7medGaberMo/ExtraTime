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
export type PlayerPoolMode = "GLOBAL" | "ACTIVE" | "EPL" | "TOP_TEAMS" | "ICONS" | string;

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
const CENTER_OUTFIELD_POSITIONS = new Set(["CB", "CDM", "CM", "CAM", "ST", "CF"]);

function matchesExact(playerPosition: string, slot: Position): boolean {
  return playerPositions(playerPosition).includes(slot);
}

function isSideCompatible(playerPosition: string, slot: Position): boolean {
  const pPositions = playerPositions(playerPosition);

  // Exact match is always compatible
  if (pPositions.includes(slot)) return true;

  // Left-sided slot: player MUST have a Left or Center position (cannot be purely Right-sided)
  if (LEFT_POSITIONS.has(slot)) {
    return pPositions.some((p) => LEFT_POSITIONS.has(p) || CENTER_OUTFIELD_POSITIONS.has(p));
  }

  // Right-sided slot: player MUST have a Right or Center position (cannot be purely Left-sided)
  if (RIGHT_POSITIONS.has(slot)) {
    return pPositions.some((p) => RIGHT_POSITIONS.has(p) || CENTER_OUTFIELD_POSITIONS.has(p));
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
  const pPositions = playerPositions(playerPosition);

  // 1. Strict GK Isolation
  const isGkSlot = slot === "GK";
  const isPlayerGk = pPositions.includes("GK");
  if (isGkSlot && !isPlayerGk) return 0;
  if (!isGkSlot && isPlayerGk) return 0;
  if (isGkSlot && isPlayerGk) return 100;

  // 2. Exact match for any position (CB, ST, LW, RW, CM, CDM, CAM, LB, RB, LM, RM, CF, LWB, RWB)
  if (pPositions.includes(slot)) return 100;

  // 3. Direct natural variants for all position categories
  const variants: Partial<Record<Position, Position[]>> = {
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
    CM: ["CDM", "CAM"],
    CDM: ["CM", "CAM"],
    CAM: ["CM", "CDM"],
  };

  const allowed = variants[slot];
  if (allowed && pPositions.some((p) => allowed.includes(p as Position))) {
    return 80;
  }

  // 4. Return 0 for all other cross-position mismatches
  return 0;
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
  ctx: ScoringContext
): number {
  let score = 0;

  // 1. Position fit (0–100, heavily weighted to preserve categories)
  const posFit = positionFitScore(player.position, slot);
  if (posFit === 0) return 0; // Strictly exclude positionally incompatible candidates
  score += posFit * 3;

  // 2. High Tier preference for overall quality, balanced across upper tiers
  const rank = tierRank(player.tier);
  score += Math.max(0, (6 - rank) * 12);

  // 3. Tier budget bonus — favor tiers we still need for target ratio
  const remaining = ctx.tierBudget.get(player.tier) ?? 0;
  if (remaining > 0) score += 25;

  // 4. Club diversity penalty
  const clubCount = ctx.usedClubs.get(player.clubId) ?? 0;
  score -= clubCount * 20;

  // 5. Nation diversity penalty
  const nationCount = ctx.usedNations.get(player.nationId) ?? 0;
  score -= nationCount * 8;

  return Math.max(1, score);
}

const TOP_CLUB_NAMES = new Set([
  "Real Madrid", "Barcelona", "Barca", "Atlético Madrid", "Atletico Madrid",
  "Manchester City", "Man City", "Arsenal", "Liverpool", "Manchester United", "Man Utd", "Chelsea", "Tottenham",
  "Bayern Munich", "Bayern", "Borussia Dortmund", "Dortmund",
  "Paris Saint-Germain", "PSG",
  "AC Milan", "Inter Milan", "Inter", "Juventus", "Juve", "Napoli",
]);

// ── Tier Distribution Planning ─────────────────────────────
// Enforces 80% to 85% Elite & Above (ICON, HERO, ULTIMATE, MASTER, ELITE) and 15% to 20% Gold/Lower
function planTierBudget(pool: PoolPlayer[], totalSlots: number): Map<Tier, number> {
  const available = new Map<Tier, number>();
  for (const p of pool) {
    available.set(p.tier, (available.get(p.tier) ?? 0) + 1);
  }

  // Target ratios: 85% Elite or higher (ICON, HERO, ULTIMATE, MASTER, ELITE), 15% Gold & lower
  const targetRatios: Record<Tier, number> = {
    ICON: 0.15,        // Upper tier ~15%
    HERO: 0.15,        // Upper tier ~15%
    ULTIMATE: 0.22,    // Upper tier ~22%
    MASTER: 0.18,      // Upper tier ~18%
    ELITE: 0.15,       // Upper tier ~15% (Total Upper = 85%)
    GOLD: 0.10,        // Lower tier ~10%
    SILVER: 0.04,      // Lower tier ~4%
    BRONZE: 0.01,      // Lower tier ~1%  (Total Lower = 15%)
  };

  const budget = new Map<Tier, number>();
  for (const tier of Object.keys(TIER_RANK) as Tier[]) {
    const availCount = available.get(tier) ?? 0;
    if (availCount === 0) {
      budget.set(tier, 0);
      continue;
    }
    const ratio = targetRatios[tier] ?? 0.05;
    const ideal = Math.max(1, Math.round(totalSlots * 2 * ratio));
    budget.set(tier, Math.min(ideal, availCount));
  }
  return budget;
}

// ── Football Media Agency Dynamic Pair Selection ─────────────
// Dynamic outcomes for friend entertainment:
// 1. JACKPOT_SUB_SURPRISE (~30%): Sub is HIGHER tier than Main (Losing bid gets secret upgrade!)
// 2. CLASH_OF_TITANS (~35%): Main and Sub are EQUAL tier (High tension parity duel)
// 3. CLASSIC_MAIN (~35%): Main is HIGHER tier than Sub (Classic target lead)
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

  // Filter candidates strictly matching position category rules
  let candidates = unused
    .map((p) => ({
      player: p,
      score: scoreCandidate(p, slot, scoringCtx),
    }))
    .filter((c) => c.score > 0);

  if (candidates.length < 2) {
    const isGk = slot === "GK";
    // Level 2 Fallback: Line-compatible candidates (excluding cross GK/Outfield)
    const lineCandidates = unused
      .filter((p) => {
        const pIsGk = playerPositions(p.position).includes("GK");
        if (isGk) return pIsGk;
        if (pIsGk) return false;
        return matchesLine(p.position, slot);
      })
      .map((p) => ({
        player: p,
        score: Math.max(1, scoreCandidate(p, slot, scoringCtx) || 50),
      }));

    if (lineCandidates.length >= 2) {
      candidates = lineCandidates;
    } else {
      // Level 3 Fallback: Any outfield player for outfield slots, any GK for GK slots
      const roleCandidates = unused
        .filter((p) => {
          const pIsGk = playerPositions(p.position).includes("GK");
          return isGk ? pIsGk : !pIsGk;
        })
        .map((p) => ({
          player: p,
          score: 30,
        }));

      candidates = roleCandidates.length >= 2 ? roleCandidates : unused.map((p) => ({ player: p, score: 10 }));
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  // Sample top candidates for position fit and quality
  const topCandidates = candidates.slice(0, Math.min(8, candidates.length));

  // Pick first candidate weighted by score
  const c1Weights = topCandidates.map((c) => c.score);
  const playerA = weightedPick(topCandidates, c1Weights).player;

  // Remaining candidates excluding playerA
  const subPool = topCandidates.filter((c) => c.player._id !== playerA._id);
  const c2Weights = subPool.map((c) => c.score);
  const playerB = weightedPick(subPool, c2Weights).player;

  const rankA = tierRank(playerA.tier); // lower number = higher tier
  const rankB = tierRank(playerB.tier);

  let main: PoolPlayer;
  let sub: PoolPlayer;

  // Media Agency Dynamic Pairing Decision Roll
  const roll = Math.random();

  if (roll < 0.30) {
    // 🌟 JACKPOT_SUB_SURPRISE (~30%): Sub gets the higher tier player!
    if (rankA < rankB) {
      // playerA is higher tier -> make playerA the SUB!
      sub = playerA;
      main = playerB;
    } else if (rankB < rankA) {
      // playerB is higher tier -> make playerB the SUB!
      sub = playerB;
      main = playerA;
    } else {
      // Equal tier: randomly assign
      if (Math.random() < 0.5) {
        main = playerA;
        sub = playerB;
      } else {
        main = playerB;
        sub = playerA;
      }
    }
  } else if (roll < 0.65) {
    // ⚔️ CLASH_OF_TITANS (~35%): Try to pair equal/similar tiers for a tense duel
    // Attempt to pick a sub from unused that matches playerA's tier
    const sameTierCandidate = unused.find(
      (p) => p._id !== playerA._id && p.tier === playerA.tier && positionFitScore(p.position, slot) > 0
    );

    if (sameTierCandidate) {
      const isAFirst = Math.random() < 0.5;
      main = isAFirst ? playerA : sameTierCandidate;
      sub = isAFirst ? sameTierCandidate : playerA;
    } else {
      // 50/50 assignment of selected pair
      const isAFirst = Math.random() < 0.5;
      main = isAFirst ? playerA : playerB;
      sub = isAFirst ? playerB : playerA;
    }
  } else {
    // 👑 CLASSIC_MAIN (~35%): Main gets the higher tier player!
    if (rankA < rankB) {
      main = playerA;
      sub = playerB;
    } else if (rankB < rankA) {
      main = playerB;
      sub = playerA;
    } else {
      main = playerA;
      sub = playerB;
    }
  }

  // 15% Random Chaos Flip for maximum surprise factor among friends
  if (Math.random() < 0.15) {
    const temp = main;
    main = sub;
    sub = temp;
  }

  return [main, sub];
}

// ── Dramatic Round Ordering ────────────────────────────────
function orderByFormation(rounds: Array<DraftRound & { sortIndex: number }>): DraftRound[] {
  return [...rounds]
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map(({ sortIndex, ...round }, idx) => {
      void sortIndex;
      return {
        ...round,
        roundNumber: idx + 1,
      };
    });
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
      if (poolMode === "ICONS") return player.isLegend || player.tier === "ICON" || player.tier === "HERO";
      if (poolMode === "ACTIVE") return !player.isLegend && player.tier !== "ICON" && player.tier !== "HERO";
      if (poolMode === "EPL") {
        // Active EPL players only — no legends/icons
        return clubById.get(player.clubId)?.league === "Premier League"
          && !player.isLegend && player.tier !== "ICON" && player.tier !== "HERO";
      }
      if (poolMode === "TOP_TEAMS") {
        // Active top-club players only — no legends/icons
        const clubName = clubById.get(player.clubId)?.name ?? "";
        return TOP_CLUB_NAMES.has(clubName) && !player.isLegend && player.tier !== "ICON" && player.tier !== "HERO";
      }
      return true; // GLOBAL — all players including legends
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
  const rawRounds: Array<DraftRound & { sortIndex: number }> = [];
  for (const { position, origIdx } of positionsByScarcity) {
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
      sortIndex: origIdx,
    });
  }

  // Pick scarce slots first for quality, then reveal in the formation's tactical order.
  const ordered = orderByFormation(rawRounds);
  return assignMysteryRounds(ordered, pool);
}
