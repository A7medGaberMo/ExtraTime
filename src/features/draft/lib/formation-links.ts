export interface FormationLink {
  from: number; // slotIndex A
  to: number;   // slotIndex B
}

export type LinkStrength = 'perfect' | 'strong' | 'weak' | 'dead' | 'empty';

export interface LinkStyle {
  color: string;
  glow: string;
  dash?: string;
  width: number;
}

/**
 * Tactical connection adjacency links for each formation (0 to 10 slots)
 */
export const FORMATION_LINKS: Record<string, FormationLink[]> = {
  // 4-3-3: [ST(0), LW(1), RW(2), CAM(3), CM(4), CM(5), LB(6), CB(7), CB(8), RB(9), GK(10)]
  '4-3-3': [
    { from: 0, to: 1 }, // ST - LW
    { from: 0, to: 2 }, // ST - RW
    { from: 0, to: 3 }, // ST - CAM
    { from: 1, to: 4 }, // LW - CM (L)
    { from: 1, to: 6 }, // LW - LB
    { from: 2, to: 5 }, // RW - CM (R)
    { from: 2, to: 9 }, // RW - RB
    { from: 3, to: 4 }, // CAM - CM (L)
    { from: 3, to: 5 }, // CAM - CM (R)
    { from: 4, to: 7 }, // CM (L) - CB (L)
    { from: 4, to: 6 }, // CM (L) - LB
    { from: 5, to: 8 }, // CM (R) - CB (R)
    { from: 5, to: 9 }, // CM (R) - RB
    { from: 6, to: 7 }, // LB - CB (L)
    { from: 7, to: 8 }, // CB (L) - CB (R)
    { from: 8, to: 9 }, // CB (R) - RB
    { from: 7, to: 10 }, // CB (L) - GK
    { from: 8, to: 10 }, // CB (R) - GK
  ],

  // 4-2-3-1: [ST(0), CAM(1), LM(2), RM(3), CDM(4), CDM(5), LB(6), CB(7), CB(8), RB(9), GK(10)]
  '4-2-3-1': [
    { from: 0, to: 1 }, // ST - CAM
    { from: 0, to: 2 }, // ST - LM
    { from: 0, to: 3 }, // ST - RM
    { from: 1, to: 2 }, // CAM - LM
    { from: 1, to: 3 }, // CAM - RM
    { from: 1, to: 4 }, // CAM - CDM (L)
    { from: 1, to: 5 }, // CAM - CDM (R)
    { from: 2, to: 4 }, // LM - CDM (L)
    { from: 2, to: 6 }, // LM - LB
    { from: 3, to: 5 }, // RM - CDM (R)
    { from: 3, to: 9 }, // RM - RB
    { from: 4, to: 5 }, // CDM (L) - CDM (R)
    { from: 4, to: 7 }, // CDM (L) - CB (L)
    { from: 5, to: 8 }, // CDM (R) - CB (R)
    { from: 6, to: 7 }, // LB - CB (L)
    { from: 7, to: 8 }, // CB (L) - CB (R)
    { from: 8, to: 9 }, // CB (R) - RB
    { from: 7, to: 10 }, // CB (L) - GK
    { from: 8, to: 10 }, // CB (R) - GK
  ],

  // 4-4-2: [ST(0), CF(1), LM(2), RM(3), CM(4), CM(5), LB(6), CB(7), CB(8), RB(9), GK(10)]
  '4-4-2': [
    { from: 0, to: 1 }, // ST - CF
    { from: 0, to: 2 }, // ST - LM
    { from: 0, to: 4 }, // ST - CM (L)
    { from: 1, to: 3 }, // CF - RM
    { from: 1, to: 5 }, // CF - CM (R)
    { from: 2, to: 4 }, // LM - CM (L)
    { from: 2, to: 6 }, // LM - LB
    { from: 3, to: 5 }, // RM - CM (R)
    { from: 3, to: 9 }, // RM - RB
    { from: 4, to: 5 }, // CM (L) - CM (R)
    { from: 4, to: 7 }, // CM (L) - CB (L)
    { from: 5, to: 8 }, // CM (R) - CB (R)
    { from: 6, to: 7 }, // LB - CB (L)
    { from: 7, to: 8 }, // CB (L) - CB (R)
    { from: 8, to: 9 }, // CB (R) - RB
    { from: 7, to: 10 }, // CB (L) - GK
    { from: 8, to: 10 }, // CB (R) - GK
  ],

  // 3-5-2: [ST(0), ST(1), CAM(2), LM(3), RM(4), CDM(5), CM(6), CB(7), CB(8), CB(9), GK(10)]
  '3-5-2': [
    { from: 0, to: 1 }, // ST - ST
    { from: 0, to: 2 }, // ST - CAM
    { from: 1, to: 2 }, // ST - CAM
    { from: 2, to: 3 }, // CAM - LM
    { from: 2, to: 4 }, // CAM - RM
    { from: 2, to: 5 }, // CAM - CDM
    { from: 2, to: 6 }, // CAM - CM
    { from: 3, to: 5 }, // LM - CDM
    { from: 3, to: 7 }, // LM - CB (L)
    { from: 4, to: 6 }, // RM - CM
    { from: 4, to: 9 }, // RM - CB (R)
    { from: 5, to: 6 }, // CDM - CM
    { from: 5, to: 7 }, // CDM - CB (L)
    { from: 5, to: 8 }, // CDM - CB (C)
    { from: 6, to: 8 }, // CM - CB (C)
    { from: 6, to: 9 }, // CM - CB (R)
    { from: 7, to: 8 }, // CB (L) - CB (C)
    { from: 8, to: 9 }, // CB (C) - CB (R)
    { from: 7, to: 10 }, // CB (L) - GK
    { from: 8, to: 10 }, // CB (C) - GK
    { from: 9, to: 10 }, // CB (R) - GK
  ],

  // 4-1-2-1-2: [ST(0), CF(1), CAM(2), CM(3), CM(4), CDM(5), LB(6), CB(7), CB(8), RB(9), GK(10)]
  '4-1-2-1-2': [
    { from: 0, to: 1 }, // ST - CF
    { from: 0, to: 2 }, // ST - CAM
    { from: 1, to: 2 }, // CF - CAM
    { from: 2, to: 3 }, // CAM - CM (L)
    { from: 2, to: 4 }, // CAM - CM (R)
    { from: 3, to: 5 }, // CM (L) - CDM
    { from: 3, to: 6 }, // CM (L) - LB
    { from: 4, to: 5 }, // CM (R) - CDM
    { from: 4, to: 9 }, // CM (R) - RB
    { from: 5, to: 7 }, // CDM - CB (L)
    { from: 5, to: 8 }, // CDM - CB (R)
    { from: 6, to: 7 }, // LB - CB (L)
    { from: 7, to: 8 }, // CB (L) - CB (R)
    { from: 8, to: 9 }, // CB (R) - RB
    { from: 7, to: 10 }, // CB (L) - GK
    { from: 8, to: 10 }, // CB (R) - GK
  ],
};

export interface PlayerLinkData {
  tier?: string;
  clubName?: string;
  league?: string;
  nationName?: string;
}

/**
 * Calculates authentic FUT link strength between two players
 */
export function calculateLinkStrength(
  playerA?: PlayerLinkData | null,
  playerB?: PlayerLinkData | null,
): LinkStrength {
  if (!playerA || !playerB) {
    return 'empty';
  }

  // Icons / Heroes always give at least strong link
  const isSpecialA = playerA.tier === 'ICON' || playerA.tier === 'HERO';
  const isSpecialB = playerB.tier === 'ICON' || playerB.tier === 'HERO';
  if (isSpecialA || isSpecialB) {
    if (playerA.nationName && playerB.nationName && playerA.nationName === playerB.nationName) {
      return 'perfect';
    }
    return 'strong';
  }

  const cA = playerA.clubName?.trim().toLowerCase();
  const cB = playerB.clubName?.trim().toLowerCase();
  const sameClub = Boolean(cA && cB && (cA === cB || cA.includes(cB) || cB.includes(cA)));

  const nA = playerA.nationName?.trim().toLowerCase();
  const nB = playerB.nationName?.trim().toLowerCase();
  const sameNation = Boolean(nA && nB && (nA === nB || nA.includes(nB) || nB.includes(nA)));

  const lA = playerA.league?.trim().toLowerCase();
  const lB = playerB.league?.trim().toLowerCase();
  const sameLeague = Boolean(lA && lB && (lA === lB || lA.includes(lB) || lB.includes(lA)));

  // Perfect Link: Same club + Same nation
  if (sameClub && sameNation) {
    return 'perfect';
  }

  // Strong Link: Same club OR (Same nation + Same league)
  if (sameClub || (sameNation && sameLeague)) {
    return 'strong';
  }

  // Weak Link: Same nation OR Same league
  if (sameNation || sameLeague) {
    return 'weak';
  }

  return 'dead';
}

/**
 * Returns Apple-grade vibrant styling for each link strength
 */
export function getLinkStyle(strength: LinkStrength): LinkStyle {
  switch (strength) {
    case 'perfect':
      return {
        color: '#10B981', // Cupertino Emerald
        glow: 'rgba(16, 185, 129, 0.7)',
        width: 2.75,
      };
    case 'strong':
      return {
        color: '#22C55E', // Vivid Green
        glow: 'rgba(34, 197, 94, 0.5)',
        width: 2.2,
      };
    case 'weak':
      return {
        color: '#F59E0B', // Amber Gold
        glow: 'rgba(245, 158, 11, 0.4)',
        width: 1.6,
      };
    case 'dead':
      return {
        color: 'rgba(239, 68, 68, 0.55)', // Dim Red
        glow: 'transparent',
        dash: '4, 4',
        width: 1.2,
      };
    case 'empty':
    default:
      return {
        color: 'rgba(255, 255, 255, 0.09)',
        glow: 'transparent',
        dash: '3, 4',
        width: 1,
      };
  }
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

export function getNextNaturalDraftSlot<T extends { position: string; player?: any }>(
  starters: T[],
): T | undefined {
  const unfilled = starters.filter((s) => !s.player);
  if (unfilled.length === 0) return undefined;
  return [...unfilled].sort(
    (a, b) => getPositionDraftPriority(a.position) - getPositionDraftPriority(b.position),
  )[0];
}
