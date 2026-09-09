import { describe, it, expect } from 'vitest';
import {
  getPlayerCandidateWeight,
  pickWeightedUnique,
  getNextNaturalDraftSlot,
  getFormationSlots,
} from '../convex/draft/generator';
import { isPositionCompatible } from '../convex/draft/chemistry';
import { Doc } from '../convex/_generated/dataModel';

describe('Draft Candidate Generator & Synergy Tests', () => {
  describe('pickWeightedUnique', () => {
    it('returns exact count requested and all unique items', () => {
      const pool = Array.from({ length: 20 }, (_, i) => ({ _id: `p_${i}`, val: i }));
      const picked = pickWeightedUnique(pool, 5, () => 1);
      expect(picked).toHaveLength(5);
      const uniqueIds = new Set(picked.map((p) => p._id));
      expect(uniqueIds.size).toBe(5);
    });

    it('heavily favors higher weighted items', () => {
      const pool = [
        { _id: 'high_1', weight: 100 },
        { _id: 'high_2', weight: 100 },
        { _id: 'low_1', weight: 0.01 },
        { _id: 'low_2', weight: 0.01 },
        { _id: 'low_3', weight: 0.01 },
      ];

      let highCount = 0;
      for (let i = 0; i < 50; i++) {
        const picked = pickWeightedUnique(pool, 2, (item) => item.weight);
        if (picked.some((p) => p._id.startsWith('high_'))) highCount++;
      }
      expect(highCount).toBeGreaterThanOrEqual(48);
    });
  });

  describe('getPlayerCandidateWeight', () => {
    it('grants ultra-high weight to 90+ and Icon/Hero cards', () => {
      const icon = { tier: 'ICON', rating: 94 } as Doc<'players'>;
      const hero = { tier: 'HERO', rating: 89 } as Doc<'players'>;
      const master = { tier: 'MASTER', rating: 87 } as Doc<'players'>;
      const gold = { tier: 'GOLD', rating: 81 } as Doc<'players'>;
      const bronze = { tier: 'BRONZE', rating: 68 } as Doc<'players'>;

      const wIcon = getPlayerCandidateWeight(icon);
      const wHero = getPlayerCandidateWeight(hero);
      const wMaster = getPlayerCandidateWeight(master);
      const wGold = getPlayerCandidateWeight(gold);
      const wBronze = getPlayerCandidateWeight(bronze);

      expect(wIcon).toBe(12);
      expect(wHero).toBe(12);
      expect(wMaster).toBe(8);
      expect(wGold).toBe(2.5);
      expect(wBronze).toBe(0.15);

      expect(wIcon / wBronze).toBeGreaterThan(50);
    });
  });

  describe('Natural Draft Slot Sequence', () => {
    it('moves from GK forward into defense, midfield, and attack', () => {
      const slots = getFormationSlots('4-3-3').map((pos, idx) => ({
        slotIndex: idx,
        position: pos,
        playerId: undefined as string | undefined,
      }));

      const firstSlot = getNextNaturalDraftSlot(slots);
      expect(firstSlot?.position).toBe('GK');

      if (firstSlot) firstSlot.playerId = 'gk_player';
      const secondSlot = getNextNaturalDraftSlot(slots);
      expect(['RB', 'LB']).toContain(secondSlot?.position);
    });
  });

  describe('Position Compatibility', () => {
    it('correctly validates position compatibility and variants', () => {
      expect(isPositionCompatible('GK', 'GK')).toBe(true);
      expect(isPositionCompatible('GK', 'CB')).toBe(false);
      expect(isPositionCompatible('ST', 'ST')).toBe(true);
      expect(isPositionCompatible('ST', 'CF')).toBe(true);
      expect(isPositionCompatible('CB', 'CDM')).toBe(true);
      expect(isPositionCompatible('LW', 'LM/LW')).toBe(true);
    });
  });
});
