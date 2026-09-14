import { describe, it, expect } from 'vitest';
import { allRankSeedQuestions } from '../convex/rank/seedData';
import { validateRankQuestion } from '../convex/rank/validate';

describe('Rank Question Bank Invariants', () => {
  it('should have at least 200 questions in total', () => {
    expect(allRankSeedQuestions.length).toBeGreaterThanOrEqual(200);
  });

  it('should have unique titles for all questions in bank', () => {
    const titles = new Set<string>();
    for (const q of allRankSeedQuestions) {
      const key = q.title.en.trim().toLowerCase();
      expect(titles.has(key)).toBe(false);
      titles.add(key);
    }
  });

  it('should strictly satisfy all validation invariants (5 answers, bilingual, valid stats)', () => {
    for (const q of allRankSeedQuestions) {
      const res = validateRankQuestion(q);
      if (!res.valid) {
        throw new Error(`Validation failed for "${q.title.en}": ${res.error}`);
      }
      expect(res.valid).toBe(true);
    }
  });

  it('should have media defined for every answer', () => {
    for (const q of allRankSeedQuestions) {
      for (const a of q.answers) {
        expect(a.media).toBeDefined();
        expect(a.media.type).toBeDefined();
      }
    }
  });
});
