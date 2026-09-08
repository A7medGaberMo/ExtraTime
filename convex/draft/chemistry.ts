export interface ChemistryPlayerInput {
  slotIndex: number;
  slotPosition: string; // "GK", "CB", "ST", etc.
  playerId?: string;
  playerPosition?: string; // e.g. "LW/ST" or "CB"
  tier?: string;
  rating?: number;
  clubId?: string;
  clubName?: string;
  league?: string;
  nationId?: string;
  nationName?: string;
  isCaptain?: boolean;
}

export interface ChemistryCalculationResult {
  totalChemistry: number; // 0 to 33
  squadRating: number; // 0 to 99
  totalDraftScore: number; // squadRating + totalChemistry
  slotChemistry: Map<number, number>; // slotIndex -> 0..3
  inPositionMap: Map<number, boolean>;
}

// Position Category Variants (Authentic FC / FUT realistic nearest positions)
const POSITION_VARIANTS: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB', 'CDM '],
  LB: ['LB', 'LWB'],
  LWB: ['LWB', 'LB', 'LM'],
  RB: ['RB', 'RWB'],
  RWB: ['RWB', 'RB', 'RM'],
  CDM: ['CDM', 'CM', 'CB'],
  CM: ['CM', 'CDM', 'CAM'],
  CAM: ['CAM', 'CM', 'CF'],
  LM: ['LM', 'LW', 'LWB', 'LB', 'RM'],
  RM: ['RM', 'RW', 'RWB', 'RB', 'LM'],
  LW: ['LW', 'LM', 'RW', 'CAM'],
  RW: ['RW', 'RM', 'LW', 'CAM'],
  ST: ['ST', 'CF'],
  CF: ['CF', 'ST', 'CAM'],
};

export function isPositionCompatible(slotPos: string, playerPos?: string): boolean {
  if (!playerPos) return false;
  const s = slotPos.trim().toUpperCase();
  const playerPositions = playerPos
    .split('/')
    .map((p) => p.trim().toUpperCase());

  // Strict GK check
  if (s === 'GK') return playerPositions.includes('GK');
  if (playerPositions.includes('GK')) return false;

  // Direct match
  if (playerPositions.includes(s)) return true;

  // Variant match
  const allowed = POSITION_VARIANTS[s] || [s];
  return playerPositions.some((p) => allowed.includes(p));
}

export function computeBaseRating(p: { tier?: string; rating?: number }): number {
  if (p.rating && p.rating >= 60 && p.rating <= 99) return p.rating;
  switch (p.tier) {
    case 'ICON':
      return 93;
    case 'HERO':
      return 89;
    case 'ULTIMATE':
      return 91;
    case 'MASTER':
      return 87;
    case 'ELITE':
      return 84;
    case 'GOLD':
      return 80;
    case 'SILVER':
      return 74;
    case 'BRONZE':
      return 68;
    default:
      return 78;
  }
}

/**
 * Calculates complete authentic FUT Chemistry & Squad Rating for the Starting XI
 */
export function calculateSquadChemistry(
  starters: ChemistryPlayerInput[],
): ChemistryCalculationResult {
  const slotChemistry = new Map<number, number>();
  const inPositionMap = new Map<number, boolean>();

  // Only consider active filled starters
  const activeStarters = starters.filter((s) => s.playerId && s.playerPosition);

  if (activeStarters.length === 0) {
    return {
      totalChemistry: 0,
      squadRating: 0,
      totalDraftScore: 0,
      slotChemistry,
      inPositionMap,
    };
  }

  // Check positions
  for (const s of starters) {
    if (!s.playerId) {
      slotChemistry.set(s.slotIndex, 0);
      inPositionMap.set(s.slotIndex, false);
      continue;
    }
    const inPos = isPositionCompatible(s.slotPosition, s.playerPosition);
    inPositionMap.set(s.slotIndex, inPos);
  }

  // Count synergy contributions from players playing IN POSITION
  const clubCounts = new Map<string, number>();
  const nationCounts = new Map<string, number>();
  const leagueCounts = new Map<string, number>();

  for (const s of activeStarters) {
    const inPos = inPositionMap.get(s.slotIndex);
    if (!inPos) continue; // Out-of-position contributes 0

    if (s.clubId) {
      clubCounts.set(s.clubId, (clubCounts.get(s.clubId) ?? 0) + 1);
    }
    if (s.nationId) {
      // Icons provide +2 nation links
      const add = s.tier === 'ICON' ? 2 : 1;
      nationCounts.set(s.nationId, (nationCounts.get(s.nationId) ?? 0) + add);
    }
    if (s.league) {
      // Heroes provide +2 league links
      const add = s.tier === 'HERO' ? 2 : 1;
      leagueCounts.set(s.league, (leagueCounts.get(s.league) ?? 0) + add);
    }
  }

  // Thresholds
  const getClubBonus = (cnt: number) => (cnt >= 7 ? 3 : cnt >= 4 ? 2 : cnt >= 2 ? 1 : 0);
  const getNationBonus = (cnt: number) => (cnt >= 8 ? 3 : cnt >= 5 ? 2 : cnt >= 2 ? 1 : 0);
  const getLeagueBonus = (cnt: number) => (cnt >= 8 ? 3 : cnt >= 5 ? 2 : cnt >= 3 ? 1 : 0);

  let totalSquadChemistry = 0;
  let totalRatingSum = 0;

  for (const s of starters) {
    if (!s.playerId) continue;

    const inPos = inPositionMap.get(s.slotIndex);
    let baseOvr = computeBaseRating(s);

    if (!inPos) {
      // Out of position gets 0 chemistry and -3 rating penalty
      slotChemistry.set(s.slotIndex, 0);
      totalRatingSum += Math.max(60, baseOvr - 3);
      continue;
    }

    if (s.tier === 'ICON' || s.tier === 'HERO') {
      // Icons & Heroes get full 3 chemistry when in position
      slotChemistry.set(s.slotIndex, 3);
      totalSquadChemistry += 3;
      totalRatingSum += baseOvr;
      continue;
    }

    const cBonus = s.clubId ? getClubBonus(clubCounts.get(s.clubId) ?? 0) : 0;
    const nBonus = s.nationId ? getNationBonus(nationCounts.get(s.nationId) ?? 0) : 0;
    const lBonus = s.league ? getLeagueBonus(leagueCounts.get(s.league) ?? 0) : 0;

    const pChem = Math.min(3, cBonus + nBonus + lBonus);
    slotChemistry.set(s.slotIndex, pChem);
    totalSquadChemistry += pChem;
    totalRatingSum += baseOvr;
  }

  const finalChem = Math.min(33, totalSquadChemistry);
  const finalRating =
    activeStarters.length > 0 ? Math.round(totalRatingSum / activeStarters.length) : 0;

  return {
    totalChemistry: finalChem,
    squadRating: finalRating,
    totalDraftScore: finalRating + finalChem,
    slotChemistry,
    inPositionMap,
  };
}
