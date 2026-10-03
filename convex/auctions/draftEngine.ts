import { GenericMutationCtx } from 'convex/server';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { getFormationPositions, MatchSize } from './formations';
import {
  type Position,
  type Tier,
  TIER_RANK,
  tierRank,
  playerPositions,
} from '../lib/constants';

// ── Types ──────────────────────────────────────────────────
export type PlayerPoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS' | string;

export interface DraftRound {
  roundNumber: number;
  position: Position;
  mainPlayerId: Id<'players'>;
  subPlayerId: Id<'players'>;
  isMysteryRound?: boolean;
}

interface PoolPlayer {
  _id: Id<'players'>;
  name: string;
  position: string;
  tier: Tier;
  clubId: Id<'clubs'>;
  nationId: Id<'nations'>;
  isLegend: boolean;
}

// ── Utilities ──────────────────────────────────────────────
function weightedPick<T>(items: T[], weights: number[], random: () => number): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total === 0) return items[Math.floor(random() * items.length)];
  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Position Matching ──────────────────────────────────────
function playerIdentity(player: Pick<PoolPlayer, 'name' | 'nationId'>): string {
  const normalizedName = player.name
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
  return `${normalizedName}|${player.nationId}`;
}

const NATURAL_VARIANTS: Partial<Record<Position, Position[]>> = {
  CF: ['ST'],
  ST: ['CF'],
  LWB: ['LB'],
  LB: ['LWB', 'RB', 'CB'],
  RWB: ['RB'],
  RB: ['RWB', 'LB', 'CB'],
  CAM: ['CM', 'CDM'],
  CDM: ['CM', 'CAM'],
  CM: ['CDM', 'CAM'],
  LW: ['LM', 'RW'],
  LM: ['LW', 'RM'],
  RW: ['RM', 'LW'],
  RM: ['RW', 'LM'],
};

/** A player qualifies if exact match (100) or a natural tactical variant (40). GK is strictly isolated. */
function positionFitScore(playerPosition: string, slot: Position): number {
  const pPositions = playerPositions(playerPosition);
  if (pPositions.includes(slot)) return 100;
  if (slot === 'GK' || pPositions.includes('GK')) return 0;
  const variants = NATURAL_VARIANTS[slot];
  if (variants && pPositions.some((p) => variants.includes(p as Position))) {
    return 40;
  }
  return 0;
}

// ── Smart Candidate Scoring ────────────────────────────────
interface ScoringContext {
  usedClubs: Map<string, number>;
  usedNations: Map<string, number>;
  tierBudget: Map<Tier, number>; // how many more of this tier we want
}

function scoreCandidate(player: PoolPlayer, slot: Position, ctx: ScoringContext): number {
  const pPositions = playerPositions(player.position);
  const posFit = positionFitScore(player.position, slot);
  if (posFit === 0) return 0; // Strictly exclude positionally incompatible candidates

  let score = 0;

  // Strong bonus for exact natural position (e.g. true RW for RW instead of fullbacks)
  const isExact = pPositions.includes(slot);
  score += isExact ? 250 : 20;

  // Additional bonus if it's the primary (first-listed) natural position
  if (pPositions[0] === slot) {
    score += 100;
  }

  // Prefer high tiers strongly
  const rank = tierRank(player.tier);
  score += (8 - rank) * 100;

  // Favor tiers still present in the planned match distribution
  const remaining = ctx.tierBudget.get(player.tier) ?? 0;
  if (remaining > 0) score += 50;

  // Club diversity penalty
  const clubCount = ctx.usedClubs.get(player.clubId) ?? 0;
  score -= clubCount * 20;

  // Nation diversity penalty
  const nationCount = ctx.usedNations.get(player.nationId) ?? 0;
  score -= nationCount * 8;

  return Math.max(1, score);
}

// ── Tier Distribution Planning ─────────────────────────────
// Target ~80% ELITE and above (ICON, HERO, ULTIMATE, MASTER, ELITE) for famous stars.
// Occasional solid GOLD (~16%) for tactical value/budget, and rare SILVER (~4%).
// BRONZE is strictly 0%.
function planTierBudget(
  pool: PoolPlayer[],
  totalSlots: number,
  poolMode: string = 'GLOBAL',
): Map<Tier, number> {
  const available = new Map<Tier, number>();
  for (const p of pool) {
    available.set(p.tier, (available.get(p.tier) ?? 0) + 1);
  }

  const playerCount = totalSlots * 2;
  const budget = new Map<Tier, number>();
  for (const tier of Object.keys(TIER_RANK) as Tier[]) {
    budget.set(tier, 0);
  }

  const normMode = String(poolMode).trim().toUpperCase();
  const isIconsMode = normMode === 'ICONS';
  const isActiveMode = normMode === 'ACTIVE';

  let idealRatios: Record<Tier, number>;
  if (isIconsMode) {
    idealRatios = {
      ICON: 0.5,
      HERO: 0.5,
      ULTIMATE: 0,
      MASTER: 0,
      ELITE: 0,
      GOLD: 0,
      SILVER: 0,
      BRONZE: 0,
    };
  } else if (isActiveMode) {
    // Active Stars: 88% Elite+ (Ultimate, Master, Elite), 12% Gold, 0% Silver
    idealRatios = {
      ICON: 0,
      HERO: 0,
      ULTIMATE: 0.32,
      MASTER: 0.32,
      ELITE: 0.24,
      GOLD: 0.12,
      SILVER: 0,
      BRONZE: 0,
    };
  } else {
    // GLOBAL mode: 88% Elite+ superstars (Icon, Hero, Ultimate, Master, Elite), 12% Gold, 0% Silver
    idealRatios = {
      ICON: 0.16,
      HERO: 0.16,
      ULTIMATE: 0.22,
      MASTER: 0.20,
      ELITE: 0.14,
      GOLD: 0.12,
      SILVER: 0,
      BRONZE: 0,
    };
  }

  // 1. Initial pass: allocate ideal target using Largest Remainder Method (Hamilton's method)
  let allocated = 0;
  const remainders: Array<{ tier: Tier; rem: number }> = [];
  for (const tier of Object.keys(TIER_RANK) as Tier[]) {
    const availCount = available.get(tier) ?? 0;
    const exact = playerCount * (idealRatios[tier] ?? 0);
    const target = Math.min(availCount, Math.floor(exact));
    budget.set(tier, target);
    allocated += target;
    if (availCount > target) {
      remainders.push({ tier, rem: exact - target });
    }
  }

  // Allocate remaining fractional seats based on highest remainder
  remainders.sort((a, b) => b.rem - a.rem);
  let remIdx = 0;
  while (allocated < playerCount && remIdx < remainders.length) {
    const tier = remainders[remIdx].tier;
    const availCount = available.get(tier) ?? 0;
    const current = budget.get(tier) ?? 0;
    if (current < availCount) {
      budget.set(tier, current + 1);
      allocated++;
    }
    remIdx++;
  }

  // 2. Adaptive filling: prioritize top tiers first, then Gold, then Silver as rare fallback
  const tierPriorityOrder: Tier[] = [
    'ULTIMATE',
    'MASTER',
    'ICON',
    'HERO',
    'ELITE',
    'GOLD',
    'SILVER',
  ];

  while (allocated < playerCount) {
    let progressed = false;
    for (const tier of tierPriorityOrder) {
      const availCount = available.get(tier) ?? 0;
      const current = budget.get(tier) ?? 0;
      if (current < availCount) {
        budget.set(tier, current + 1);
        allocated++;
        progressed = true;
        if (allocated >= playerCount) break;
      }
    }
    if (!progressed) break;
  }

  // Never exceed 0.1% Bronze (strictly 0 for standard Snipe match sizes)
  const bronzeLimit = Math.max(0, Math.ceil(playerCount * 0.001) - 1);
  budget.set('BRONZE', Math.min(available.get('BRONZE') ?? 0, bronzeLimit));
  allocated = [...budget.values()].reduce((sum, count) => sum + count, 0);

  // If upper tiers cannot fill the entire requirement in smaller pools, allow Bronze as needed to prevent crashing
  if (allocated < playerCount && (available.get('BRONZE') ?? 0) > 0) {
    const bronzeNeeded = Math.min(available.get('BRONZE') ?? 0, playerCount - allocated);
    budget.set('BRONZE', bronzeNeeded);
    allocated += bronzeNeeded;
  }

  if (allocated < playerCount) {
    throw new Error(
      `Not enough position-eligible players for this Snipe match: need ${playerCount}, found ${allocated}.`,
    );
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
  scoringCtx: ScoringContext,
  random: () => number,
): [PoolPlayer, PoolPlayer] {
  const unused = pool.filter((p) => !used.has(playerIdentity(p)));
  if (unused.length < 2) {
    throw new Error(`Not enough players for position ${slot}. Only ${unused.length} left.`);
  }

  // 1. Filter candidates strictly matching position category rules
  const candidates = unused
    .map((p) => ({
      player: p,
      score: scoreCandidate(p, slot, scoringCtx),
    }))
    .filter((c) => c.score > 0);

  if (candidates.length < 2) {
    throw new Error(`Not enough players with eligible ${slot} position. Found ${candidates.length}.`);
  }

  // Respect the match-wide tier budget for both cards when possible.
  // If the tier budget for remaining tiers is depleted, fall back gracefully to all candidates.
  const withinTierBudget = candidates.filter(
    ({ player }) => (scoringCtx.tierBudget.get(player.tier) ?? 0) > 0,
  );
  const budgetCandidates = withinTierBudget.length >= 2 ? withinTierBudget : candidates;

  // Prioritize exact natural position candidates (e.g. true RW for RW) if available
  const exactCandidates = budgetCandidates.filter(
    ({ player }) => playerPositions(player.position).includes(slot),
  );
  const eligibleCandidates = exactCandidates.length >= 2 ? exactCandidates : budgetCandidates;
  eligibleCandidates.sort((a, b) => b.score - a.score);

  // Sample top candidates for tier quality and positional fit.
  const topCandidates = eligibleCandidates.slice(0, Math.min(8, eligibleCandidates.length));

  // Pick first candidate weighted by score
  const c1Weights = topCandidates.map((c) => c.score);
  const playerA = weightedPick(topCandidates, c1Weights, random).player;

  // Remaining candidates excluding playerA (prefer different player identity)
  let subPool = topCandidates.filter(
    (candidate) =>
      playerIdentity(candidate.player) !== playerIdentity(playerA) &&
      (candidate.player.tier !== playerA.tier ||
        (scoringCtx.tierBudget.get(playerA.tier) ?? 0) >= 2),
  );
  if (subPool.length === 0) {
    subPool = eligibleCandidates.filter(
      (c) => playerIdentity(c.player) !== playerIdentity(playerA),
    );
  }
  if (subPool.length === 0) {
    subPool = candidates.filter((c) => c.player._id !== playerA._id);
  }

  const c2Weights = subPool.map((c) => c.score);
  const playerB = weightedPick(subPool, c2Weights, random).player;

  const rankA = tierRank(playerA.tier); // lower number = higher tier
  const rankB = tierRank(playerB.tier);

  let main: PoolPlayer;
  let sub: PoolPlayer;

  // Media Agency Dynamic Pairing Decision Roll
  const roll = random();

  if (roll < 0.3) {
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
      if (random() < 0.5) {
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
    const sameTierCandidate = topCandidates.find(
      (candidate) =>
        playerIdentity(candidate.player) !== playerIdentity(playerA) &&
        candidate.player.tier === playerA.tier &&
        (scoringCtx.tierBudget.get(playerA.tier) ?? 0) >= 2,
    )?.player;

    if (sameTierCandidate) {
      const isAFirst = random() < 0.5;
      main = isAFirst ? playerA : sameTierCandidate;
      sub = isAFirst ? sameTierCandidate : playerA;
    } else {
      // 50/50 assignment of selected pair
      const isAFirst = random() < 0.5;
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
  if (random() < 0.15) {
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

export function getPRNG(seedStr: string): () => number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  let seed = hash >>> 0;
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function getCursor(seed: string, roundNumber: number, position: string, poolMode: string): number {
  const seedStr = `${seed}_${roundNumber}_${position}_${poolMode}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  return (hash >>> 0) / 4294967296;
}

async function sampleTierSlice(
  ctx: GenericMutationCtx<DataModel>,
  tier: Tier,
  limit: number,
  cursor: number,
): Promise<Doc<'players'>[]> {
  const batch = await ctx.db
    .query('players')
    .withIndex('by_tier_random', (q) => q.eq('tier', tier).gte('randomKey', cursor))
    .take(limit);
  if (batch.length < limit) {
    const wrap = await ctx.db
      .query('players')
      .withIndex('by_tier_random', (q) => q.eq('tier', tier).lt('randomKey', cursor))
      .take(limit - batch.length);
    batch.push(...wrap);
  }
  return batch;
}

async function fetchCandidatesForMode(
  ctx: GenericMutationCtx<DataModel>,
  poolMode: PlayerPoolMode,
  formationPositions: Position[],
  seed: string,
): Promise<{ players: Doc<'players'>[]; clubById: Map<Id<'clubs'>, Doc<'clubs'>> }> {
  void formationPositions;
  const normMode = String(poolMode).trim().toUpperCase();

  // 1. League-Specific Pools (EGYPT, EPL, or other League strings)
  let targetLeague = '';
  if (normMode === 'EGYPT' || normMode === 'EGYPTIAN PREMIER LEAGUE') {
    targetLeague = 'Egyptian Premier League';
  } else if (normMode === 'EPL' || normMode === 'PREMIER LEAGUE') {
    targetLeague = 'Premier League';
  } else if (normMode !== 'GLOBAL' && normMode !== 'ACTIVE' && normMode !== 'ICONS') {
    targetLeague = poolMode;
  }

  if (targetLeague) {
    const clubs = await ctx.db
      .query('clubs')
      .withIndex('by_league', (q) => q.eq('league', targetLeague))
      .collect();

    if (clubs.length > 0) {
      // Fetch players across clubs in this league with a bounded slice
      const playerBatches = await Promise.all(
        clubs.map((c) =>
          ctx.db
            .query('players')
            .withIndex('by_club', (q) => q.eq('clubId', c._id))
            .take(25),
        ),
      );
      const allLeaguePlayers = playerBatches
        .flat()
        .filter((p) => !p.isLegend && p.tier !== 'ICON' && p.tier !== 'HERO');

      const clubById = new Map<Id<'clubs'>, Doc<'clubs'>>();
      for (const c of clubs) {
        clubById.set(c._id, c);
      }

      // Prioritize top tiers (Elite/Master/Ultimate) first, then randomKey cursor for broad variety
      const leagueCursor = getCursor(seed, 1, 'LEAGUE', poolMode);
      allLeaguePlayers.sort((a, b) => {
        const rankDiff = tierRank(a.tier) - tierRank(b.tier);
        if (rankDiff !== 0) return rankDiff;
        const aKey = (a.randomKey ?? 0) - leagueCursor;
        const bKey = (b.randomKey ?? 0) - leagueCursor;
        return (aKey < 0 ? aKey + 1 : aKey) - (bKey < 0 ? bKey + 1 : bKey);
      });

      const pMap = new Map<string, Doc<'players'>>();
      for (const p of allLeaguePlayers) {
        pMap.set(String(p._id), p);
      }
      return { players: Array.from(pMap.values()), clubById };
    }
  }

  // 2. ICONS Pool (Legends, Icons, Heroes)
  if (normMode === 'ICONS') {
    const iconCursor = getCursor(seed, 1, 'ICON', poolMode);
    const heroCursor = getCursor(seed, 2, 'HERO', poolMode);
    const [icons, heroes, legends] = await Promise.all([
      sampleTierSlice(ctx, 'ICON', 45, iconCursor),
      sampleTierSlice(ctx, 'HERO', 45, heroCursor),
      ctx.db.query('players').withIndex('by_legend', (q) => q.eq('isLegend', true)).take(40),
    ]);
    const pMap = new Map<string, Doc<'players'>>();
    for (const p of [...icons, ...heroes, ...legends]) {
      pMap.set(String(p._id), p);
    }
    return { players: Array.from(pMap.values()), clubById: new Map() };
  }

  // 3. ACTIVE Pool: Active stars (~80% Elite+, ~16% Gold, ~4% Silver, zero legends)
  if (normMode === 'ACTIVE') {
    const [ultimates, masters, elites, golds, silvers] = await Promise.all([
      sampleTierSlice(ctx, 'ULTIMATE', 35, getCursor(seed, 1, 'ULTIMATE', poolMode)),
      sampleTierSlice(ctx, 'MASTER', 45, getCursor(seed, 2, 'MASTER', poolMode)),
      sampleTierSlice(ctx, 'ELITE', 55, getCursor(seed, 3, 'ELITE', poolMode)),
      sampleTierSlice(ctx, 'GOLD', 30, getCursor(seed, 4, 'GOLD', poolMode)),
      sampleTierSlice(ctx, 'SILVER', 12, getCursor(seed, 5, 'SILVER', poolMode)),
    ]);
    const pMap = new Map<string, Doc<'players'>>();
    for (const p of [...ultimates, ...masters, ...elites, ...golds, ...silvers]) {
      if (!p.isLegend && p.tier !== 'ICON' && p.tier !== 'HERO') {
        pMap.set(String(p._id), p);
      }
    }
    return { players: Array.from(pMap.values()), clubById: new Map() };
  }

  // 4. GLOBAL Pool: ~80% Elite+ stars (ICON, HERO, ULTIMATE, MASTER, ELITE) + ~16% Gold + ~4% Silver
  // Fast indexed queries via by_tier_random strictly bounded to eliminate DB I/O overhead
  const [icons, heroes, ultimates, masters, elites, golds, silvers] = await Promise.all([
    sampleTierSlice(ctx, 'ICON', 22, getCursor(seed, 1, 'ICON', poolMode)),
    sampleTierSlice(ctx, 'HERO', 22, getCursor(seed, 2, 'HERO', poolMode)),
    sampleTierSlice(ctx, 'ULTIMATE', 28, getCursor(seed, 3, 'ULTIMATE', poolMode)),
    sampleTierSlice(ctx, 'MASTER', 35, getCursor(seed, 4, 'MASTER', poolMode)),
    sampleTierSlice(ctx, 'ELITE', 40, getCursor(seed, 5, 'ELITE', poolMode)),
    sampleTierSlice(ctx, 'GOLD', 30, getCursor(seed, 6, 'GOLD', poolMode)),
    sampleTierSlice(ctx, 'SILVER', 12, getCursor(seed, 7, 'SILVER', poolMode)),
  ]);

  const pMap = new Map<string, Doc<'players'>>();
  for (const p of [...icons, ...heroes, ...ultimates, ...masters, ...elites, ...golds, ...silvers]) {
    pMap.set(String(p._id), p);
  }
  return { players: Array.from(pMap.values()), clubById: new Map() };
}

// ── Main Entry Point ───────────────────────────────────────
export async function generateDraftRounds(
  ctx: GenericMutationCtx<DataModel>,
  formation: string,
  matchSize: MatchSize,
  poolMode: PlayerPoolMode,
  seed: string,
): Promise<DraftRound[]> {
  const random = getPRNG(seed);
  const formationPositions = getFormationPositions(formation, matchSize);
  const { players: allPlayers, clubById } = await fetchCandidatesForMode(
    ctx,
    poolMode,
    formationPositions,
    seed,
  );

  const normMode = String(poolMode).trim().toUpperCase();

  // Filter player pool by mode
  const filtered: PoolPlayer[] = allPlayers
    .filter((player) => {
      if (normMode === 'ICONS')
        return player.isLegend || player.tier === 'ICON' || player.tier === 'HERO';
      if (normMode === 'ACTIVE')
        return !player.isLegend && player.tier !== 'ICON' && player.tier !== 'HERO';
      if (normMode === 'EPL' || normMode === 'PREMIER LEAGUE') {
        const league = clubById.get(player.clubId)?.league;
        return (league === 'Premier League' || league === 'EPL') && !player.isLegend && player.tier !== 'ICON' && player.tier !== 'HERO';
      }
      if (normMode === 'EGYPT' || normMode === 'EGYPTIAN PREMIER LEAGUE') {
        const league = clubById.get(player.clubId)?.league;
        return (league === 'Egyptian Premier League') && !player.isLegend && player.tier !== 'ICON' && player.tier !== 'HERO';
      }
      return true; // GLOBAL
    })
    .map((p) => ({
      _id: p._id,
      name: p.name,
      position: p.position,
      tier: p.tier as Tier,
      clubId: p.clubId,
      nationId: p.nationId,
      isLegend: p.isLegend,
    }));

  // Remove duplicate database records for the same real player before rounds
  // are built (imports can contain the same player under separate IDs).
  const uniquePlayers = new Map<string, PoolPlayer>();
  for (const player of filtered) {
    const identity = playerIdentity(player);
    const existing = uniquePlayers.get(identity);
    if (!existing || tierRank(player.tier) < tierRank(existing.tier)) {
      uniquePlayers.set(identity, player);
    }
  }
  const pool = [...uniquePlayers.values()];

  const requiredPlayers = formationPositions.length * 2;

  if (pool.length < requiredPlayers) {
    throw new Error(
      `Not enough players for ${matchSize}P Hidden Bid (need ${requiredPlayers}, have ${pool.length}).`,
    );
  }

  // Plan tier distribution dynamically based on available pool and poolMode
  const tierBudget = planTierBudget(pool, formationPositions.length, poolMode);
  const used = new Set<string>();
  const usedClubs = new Map<string, number>();
  const usedNations = new Map<string, number>();

  // Sort positions by scarcity (hardest to fill first)
  const positionsByScarcity = formationPositions
    .map((pos, origIdx) => {
      const available = pool.filter((p) => !used.has(playerIdentity(p)));
      const compatible = available.filter((p) => positionFitScore(p.position, pos) > 0).length;
      return { position: pos, origIdx, scarcity: compatible };
    })
    .sort((a, b) => a.scarcity - b.scarcity);

  // Select pairs for each position
  const rawRounds: Array<DraftRound & { sortIndex: number }> = [];
  for (const { position, origIdx } of positionsByScarcity) {
    const scoringCtx: ScoringContext = { usedClubs, usedNations, tierBudget };
    const [main, sub] = selectSmartPair(pool, used, position, scoringCtx, random);

    used.add(playerIdentity(main));
    used.add(playerIdentity(sub));
    usedClubs.set(main.clubId, (usedClubs.get(main.clubId) ?? 0) + 1);
    usedClubs.set(sub.clubId, (usedClubs.get(sub.clubId) ?? 0) + 1);
    usedNations.set(main.nationId, (usedNations.get(main.nationId) ?? 0) + 1);
    usedNations.set(sub.nationId, (usedNations.get(sub.nationId) ?? 0) + 1);

    // Account for both cards when distributing tiers across the match.
    for (const player of [main, sub]) {
      const remaining = tierBudget.get(player.tier) ?? 0;
      if (remaining > 0) tierBudget.set(player.tier, remaining - 1);
    }

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
