import { describe, it, expect } from 'vitest';
import { isProfane, isReservedHandle, validateCleanText } from '../convex/lib/profanity';

describe('Bilingual Profanity and Reserved Handles Engine', () => {
  describe('Reserved Handles', () => {
    it('should reject system and administrative handles', () => {
      expect(isReservedHandle('admin')).toBe(true);
      expect(isReservedHandle('ADMIN')).toBe(true);
      expect(isReservedHandle('extratime')).toBe(true);
      expect(isReservedHandle('support')).toBe(true);
      expect(isReservedHandle('official')).toBe(true);
      expect(isReservedHandle('root')).toBe(true);
      expect(isReservedHandle('moderator')).toBe(true);
    });

    it('should accept ordinary player usernames', () => {
      expect(isReservedHandle('ronaldo7')).toBe(false);
      expect(isReservedHandle('messi_10')).toBe(false);
      expect(isReservedHandle('tactician_king')).toBe(false);
    });
  });

  describe('English Moderation', () => {
    it('should reject obvious profane terms', () => {
      expect(isProfane('bitch')).toBe(true);
      expect(isProfane('asshole')).toBe(true);
      expect(isProfane('faggot')).toBe(true);
    });

    it('should normalize leetspeak variations', () => {
      expect(isProfane('b1tch')).toBe(true);
      expect(isProfane('a$$h0le')).toBe(true);
      expect(isProfane('f@g')).toBe(true);
    });

    it('should accept clean football text', () => {
      expect(validateCleanText('Striker Pro')).toBe(true);
      expect(validateCleanText('Madridista 2026')).toBe(true);
      expect(validateCleanText('The Golden Boot')).toBe(true);
    });
  });

  describe('Arabic Moderation', () => {
    it('should reject native Arabic profane terms', () => {
      expect(isProfane('شرموط')).toBe(true);
      expect(isProfane('منيوك')).toBe(true);
      expect(isProfane('قحبة')).toBe(true);
    });

    it('should normalize Arabic tashkeel (diacritics) and tatweel', () => {
      expect(isProfane('شَـرْمُـوط')).toBe(true);
      expect(isProfane('مَـنْـيُـوك')).toBe(true);
      expect(isProfane('قَـحْـبَـة')).toBe(true);
    });

    it('should accept clean Arabic text', () => {
      expect(validateCleanText('الأسطورة ميسي')).toBe(true);
      expect(validateCleanText('مدرب القرن')).toBe(true);
      expect(validateCleanText('نادي القرن الإفريقي')).toBe(true);
    });
  });
});
