import { GenericMutationCtx } from 'convex/server';
import { DataModel, Doc, Id } from '../_generated/dataModel';
import { isPositionCompatible } from './chemistry';

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

/**
 * Generates 5 candidate cards for the active pick slot
 */
export async function generateCandidatesForSlot(
  ctx: GenericMutationCtx<DataModel>,
  slotIndex: number,
  targetPosition: string, // "CAPTAIN" or formation slot like "GK", "CB", "ST"
  usedPlayerIds: Set<string>,
): Promise<Id<'players'>[]> {
  const allPlayers = await ctx.db.query('players').collect();
  const unused = allPlayers.filter((p) => !usedPlayerIds.has(String(p._id)));

  // Slot 0 (Captain) & Slots >= 11 (Bench): Completely random from all unused players (0 bias)
  if (
    slotIndex === 0 ||
    targetPosition === 'CAPTAIN' ||
    slotIndex >= 11 ||
    targetPosition === 'BENCH'
  ) {
    const candidates = shuffleArray(unused).slice(0, 5);
    return candidates.map((c) => c._id);
  }

  // Starters (slots 1 to 10): 100% random draw from position-compatible players (no tier quotas)
  const exactPosPool = unused.filter((p) => isPositionCompatible(targetPosition, p.position));

  // If we have at least 5 position-compatible cards, draw 5 purely at random
  if (exactPosPool.length >= 5) {
    const candidates = shuffleArray(exactPosPool).slice(0, 5);
    return candidates.map((c) => c._id);
  }

  // If exact pool has fewer than 5 cards: keep all of them and pad with random unused fallback
  const picked: Doc<'players'>[] = [...exactPosPool];
  const pickedIds = new Set<string>(exactPosPool.map((p) => String(p._id)));

  const fallbackPool =
    targetPosition === 'GK'
      ? unused.filter((p) => p.position.includes('GK') && !pickedIds.has(String(p._id)))
      : unused.filter((p) => !p.position.includes('GK') && !pickedIds.has(String(p._id)));

  const shuffledFallback = shuffleArray(
    fallbackPool.length > 0
      ? fallbackPool
      : unused.filter((p) => !pickedIds.has(String(p._id))),
  );

  for (const p of shuffledFallback) {
    if (picked.length >= 5) break;
    picked.push(p);
    pickedIds.add(String(p._id));
  }

  return shuffleArray(picked).slice(0, 5).map((p) => p._id);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
