import { GenericMutationCtx } from 'convex/server';
import { DataModel, Doc, Id } from '../_generated/dataModel';
import { computeBaseRating, isPositionCompatible } from './chemistry';

export const DRAFT_FORMATIONS: Record<string, { label: string; positions: string[]; description: string }> = {
  '4-3-3': {
    label: '4-3-3 Attack',
    positions: ['ST', 'LW', 'RW', 'CAM', 'CM', 'CM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'High-octane wing play with dangerous dynamic cutbacks and midfield triangle.',
  },
  '4-2-3-1': {
    label: '4-2-3-1 Balanced',
    positions: ['ST', 'CAM', 'LM', 'RM', 'CDM', 'CDM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Rock-solid double pivot tactical control with creative playmaker freedom.',
  },
  '4-4-2': {
    label: '4-4-2 Flat',
    positions: ['ST', 'CF', 'LM', 'RM', 'CM', 'CM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Timeless twin-striker balance with disciplined flanks and box-to-box dominance.',
  },
  '3-5-2': {
    label: '3-5-2 Wingback',
    positions: ['ST', 'ST', 'CAM', 'LM', 'RM', 'CDM', 'CM', 'CB', 'CB', 'CB', 'GK'],
    description: 'Overload the midfield with aggressive wide transitions and triple central defense.',
  },
  '4-1-2-1-2': {
    label: '4-1-2-1-2 Diamond',
    positions: ['ST', 'CF', 'CAM', 'CM', 'CM', 'CDM', 'LB', 'CB', 'CB', 'RB', 'GK'],
    description: 'Narrow diamond dominance through central tiki-taka and dynamic fullbacks.',
  },
};

export const FORMATION_KEYS = Object.keys(DRAFT_FORMATIONS);

export function getFormationSlots(formationKey: string): string[] {
  return DRAFT_FORMATIONS[formationKey]?.positions ?? DRAFT_FORMATIONS['4-3-3'].positions;
}

/**
 * Natural EA FC / FUT Draft sequence priority:
 * 1. GK (Goal line drafted immediately after Captain!)
 * 2. Fullbacks (RB, RWB, LB, LWB)
 * 3. Center Backs (CB)
 * 4. Defensive Midfielders (CDM)
 * 5. Central Midfielders (CM, LM, RM)
 * 6. Attacking Midfielders (CAM)
 * 7. Wingers (RW, LW)
 * 8. Strikers (CF, ST)
 */
export function getPositionDraftPriority(pos: string): number {
  const p = pos.toUpperCase();
  if (p === 'GK') return 1;
  if (p === 'RB' || p === 'RWB') return 2;
  if (p === 'CB') return 3;
  if (p === 'LB' || p === 'LWB') return 4;
  if (p === 'CDM') return 5;
  if (p === 'CM') return 6;
  if (p === 'LM' || p === 'RM') return 7;
  if (p === 'CAM') return 8;
  if (p === 'RW' || p === 'LW') return 9;
  if (p === 'CF' || p === 'ST') return 10;
  return 11;
}

export function getNextNaturalDraftSlot<T extends { position: string; playerId?: any }>(
  starters: T[],
): T | undefined {
  const unfilled = starters.filter((s) => !s.playerId);
  if (unfilled.length === 0) return undefined;
  return [...unfilled].sort(
    (a, b) => getPositionDraftPriority(a.position) - getPositionDraftPriority(b.position),
  )[0];
}

/**
 * Deterministically pick 5 distinct formation options for a new draft run
 */
export function getAvailableFormationOptions(): string[] {
  return [...FORMATION_KEYS];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Weighting function for candidate draw:
 * Generously favors high ratings (85+) and top tiers (ICON, HERO, ULTIMATE, MASTER, ELITE).
 * Low ratings (sub-78 / bronze / silver) appear rarely, preserving high excitement.
 */
export function getPlayerCandidateWeight(player: Doc<'players'>): number {
  const rating = computeBaseRating(player);
  const tier = player.tier;

  // Ultra-tier stars & 90+ rated players appear very frequently
  if (rating >= 90 || ['ICON', 'HERO', 'ULTIMATE'].includes(tier)) {
    return 12;
  }
  // Star players (86-89 / Master)
  if (rating >= 86 || tier === 'MASTER') {
    return 8;
  }
  // High-tier regulars (83-85 / Elite)
  if (rating >= 83 || tier === 'ELITE') {
    return 5;
  }
  // Solid starters (80-82 / Gold)
  if (rating >= 80 || tier === 'GOLD') {
    return 2.5;
  }
  // Modest ratings (76-79)
  if (rating >= 76) {
    return 0.8;
  }
  // Low-tier fallback (<76 / Silver / Bronze)
  return 0.15;
}

/**
 * Samples `count` distinct items from `pool` without replacement, weighted by `weightFn`.
 */
export function pickWeightedUnique<T extends { _id: any }>(
  pool: T[],
  count: number,
  weightFn: (item: T) => number,
): T[] {
  if (pool.length <= count) return shuffleArray(pool);

  const remaining = [...pool];
  const selected: T[] = [];

  while (selected.length < count && remaining.length > 0) {
    const weights = remaining.map((item) => Math.max(0.01, weightFn(item)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let randomVal = Math.random() * totalWeight;

    let chosenIndex = 0;
    for (let i = 0; i < remaining.length; i++) {
      randomVal -= weights[i];
      if (randomVal <= 0) {
        chosenIndex = i;
        break;
      }
    }

    selected.push(remaining[chosenIndex]);
    remaining.splice(chosenIndex, 1);
  }

  return selected;
}

interface ThematicCategory {
  type: 'league' | 'nation' | 'titans';
  key: string;
  name: string;
  players: Doc<'players'>[];
}

/**
 * Finds thematic category groups (Same League, Same Nation, or Titans)
 * that have at least 5 available players.
 */
function findThematicCategories(
  pool: Doc<'players'>[],
  clubMap: Map<string, Doc<'clubs'>>,
  nationMap: Map<string, Doc<'nations'>>,
): ThematicCategory[] {
  const leagueMap = new Map<string, Doc<'players'>[]>();
  const nationMapGroup = new Map<string, { name: string; players: Doc<'players'>[] }>();
  const titans: Doc<'players'>[] = [];

  for (const player of pool) {
    // Titans
    if (['ICON', 'HERO', 'ULTIMATE', 'MASTER'].includes(player.tier)) {
      titans.push(player);
    }

    // League
    const club = clubMap.get(String(player.clubId));
    if (club?.league && club.league.trim() !== '') {
      const leagueName = club.league.trim();
      const existing = leagueMap.get(leagueName) ?? [];
      existing.push(player);
      leagueMap.set(leagueName, existing);
    }

    // Nation
    const nation = nationMap.get(String(player.nationId));
    if (nation?.name && nation.name.trim() !== '') {
      const nId = String(nation._id);
      const existing = nationMapGroup.get(nId) ?? { name: nation.name.trim(), players: [] };
      existing.players.push(player);
      nationMapGroup.set(nId, existing);
    }
  }

  const categories: ThematicCategory[] = [];

  // 1. Same League (>= 5 players)
  for (const [league, players] of leagueMap.entries()) {
    if (players.length >= 5) {
      categories.push({
        type: 'league',
        key: `league:${league}`,
        name: league,
        players,
      });
    }
  }

  // 2. Same Nation (>= 5 players)
  for (const [nationId, group] of nationMapGroup.entries()) {
    if (group.players.length >= 5) {
      categories.push({
        type: 'nation',
        key: `nation:${nationId}`,
        name: group.name,
        players: group.players,
      });
    }
  }

  // 3. Titans / High-tier legends (>= 5 players)
  if (titans.length >= 5) {
    categories.push({
      type: 'titans',
      key: 'titans',
      name: 'Icons & Legends',
      players: titans,
    });
  }

  return categories;
}

/**
 * Generates 5 candidate cards for the active pick slot.
 * Generous distribution:
 * - High-tier & high-rated players appear frequently ("not all but often").
 * - Often (~35-40% chance), all 5 candidates come from the SAME category
 *   (Same League, Same Nation, or Titans) to facilitate squad chemistry building.
 */
export async function generateCandidatesForSlot(
  ctx: GenericMutationCtx<DataModel>,
  slotIndex: number,
  targetPosition: string, // "CAPTAIN" or formation slot like "GK", "CB", "ST"
  usedPlayerIds: Set<string>,
): Promise<Id<'players'>[]> {
  const [allPlayers, allClubs, allNations] = await Promise.all([
    ctx.db.query('players').collect(),
    ctx.db.query('clubs').collect(),
    ctx.db.query('nations').collect(),
  ]);

  const clubMap = new Map<string, Doc<'clubs'>>();
  for (const c of allClubs) clubMap.set(String(c._id), c);

  const nationMap = new Map<string, Doc<'nations'>>();
  for (const n of allNations) nationMap.set(String(n._id), n);

  const unused = allPlayers.filter((p) => !usedPlayerIds.has(String(p._id)));

  // Slot 0 (Captain): Always ICON / HERO tier players, biased to highest ratings
  if (slotIndex === 0 || targetPosition === 'CAPTAIN') {
    const icons = unused.filter((p) => p.tier === 'ICON');
    if (icons.length >= 5) {
      const picked = pickWeightedUnique(icons, 5, getPlayerCandidateWeight);
      return shuffleArray(picked).map((c) => c._id);
    }
    const heroes = unused.filter((p) => p.tier === 'HERO');
    const captainPool = [...icons, ...heroes];
    if (captainPool.length >= 5) {
      const picked = pickWeightedUnique(captainPool, 5, getPlayerCandidateWeight);
      return shuffleArray(picked).map((c) => c._id);
    }
    const masters = unused.filter((p) => ['ULTIMATE', 'MASTER'].includes(p.tier));
    const allHighTiers = [...captainPool, ...masters];
    if (allHighTiers.length >= 5) {
      const picked = pickWeightedUnique(allHighTiers, 5, getPlayerCandidateWeight);
      return shuffleArray(picked).map((c) => c._id);
    }
    const picked = pickWeightedUnique(unused, 5, getPlayerCandidateWeight);
    return shuffleArray(picked).map((c) => c._id);
  }

  // Bench (Slots >= 11): Generous Super-Subs
  if (slotIndex >= 11 || targetPosition === 'BENCH') {
    // 25% chance for a same-category bench pick (e.g. all Premier League or all French super-subs)
    const categories = findThematicCategories(unused, clubMap, nationMap);
    if (categories.length > 0 && Math.random() < 0.25) {
      const chosenCat = categories[Math.floor(Math.random() * categories.length)];
      const picked = pickWeightedUnique(chosenCat.players, 5, getPlayerCandidateWeight);
      if (picked.length === 5) {
        return shuffleArray(picked).map((p) => p._id);
      }
    }

    const picked = pickWeightedUnique(unused, 5, getPlayerCandidateWeight);
    return shuffleArray(picked).map((c) => c._id);
  }

  // Starters (Slots 1 to 10): Position-compatible pool
  const exactPosPool = unused.filter((p) => isPositionCompatible(targetPosition, p.position));

  if (exactPosPool.length >= 5) {
    // 1. Thematic / Same-Category Pick (~35-40% chance):
    // All 5 candidates belong to the same League, same Nation, or Titans
    const categories = findThematicCategories(exactPosPool, clubMap, nationMap);
    const triggerSameCategory = categories.length > 0 && Math.random() < 0.38;

    if (triggerSameCategory) {
      const chosenCat = categories[Math.floor(Math.random() * categories.length)];
      const picked = pickWeightedUnique(chosenCat.players, 5, getPlayerCandidateWeight);
      if (picked.length === 5) {
        return shuffleArray(picked).map((p) => p._id);
      }
    }

    // 2. Generous Mixed Pick:
    // Ensure 1-2 marquee cards (85+ OVR or Elite/Master/Hero/Icon) appear often ("not all but often")
    const marqueePool = exactPosPool.filter(
      (p) =>
        computeBaseRating(p) >= 85 ||
        ['ICON', 'HERO', 'ULTIMATE', 'MASTER', 'ELITE'].includes(p.tier),
    );
    const regularPool = exactPosPool.filter((p) => !marqueePool.some((m) => m._id === p._id));

    if (marqueePool.length > 0) {
      const marqueeCount = Math.min(marqueePool.length, Math.random() < 0.65 ? 2 : 1);
      const marqueePicked = pickWeightedUnique(marqueePool, marqueeCount, getPlayerCandidateWeight);
      const remainingNeeded = 5 - marqueePicked.length;
      const otherPicked = pickWeightedUnique(
        regularPool.length >= remainingNeeded
          ? regularPool
          : exactPosPool.filter((p) => !marqueePicked.some((mp) => mp._id === p._id)),
        remainingNeeded,
        getPlayerCandidateWeight,
      );
      const combined = [...marqueePicked, ...otherPicked];
      if (combined.length === 5) {
        return shuffleArray(combined).map((p) => p._id);
      }
    }

    const picked = pickWeightedUnique(exactPosPool, 5, getPlayerCandidateWeight);
    return shuffleArray(picked).map((p) => p._id);
  }

  // Fallback if exact pool has fewer than 5 cards:
  // Take all available exact cards, then pad with high-quality fallback cards
  const picked: Doc<'players'>[] = [...exactPosPool];
  const pickedIds = new Set<string>(exactPosPool.map((p) => String(p._id)));

  const fallbackPool =
    targetPosition === 'GK'
      ? unused.filter((p) => p.position.includes('GK') && !pickedIds.has(String(p._id)))
      : unused.filter((p) => !p.position.includes('GK') && !pickedIds.has(String(p._id)));

  const poolToDraw =
    fallbackPool.length > 0
      ? fallbackPool
      : unused.filter((p) => !pickedIds.has(String(p._id)));

  const needed = 5 - picked.length;
  const padded = pickWeightedUnique(poolToDraw, needed, getPlayerCandidateWeight);
  for (const p of padded) {
    if (picked.length >= 5) break;
    picked.push(p);
  }

  return shuffleArray(picked).slice(0, 5).map((p) => p._id);
}
