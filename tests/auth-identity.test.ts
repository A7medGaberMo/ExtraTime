import { describe, it, expect } from 'vitest';
import { generateCrockfordCode, generateRoomCode } from '../convex/lib/codeGen';
import { generateSessionToken, verifyGuestSession, isGuestOwner } from '../convex/lib/auth';
import type { Id } from '../convex/_generated/dataModel';

describe('Auth Identity & Code Generation', () => {
  describe('Username Validation Regex', () => {
    const isValidUsername = (username: string) => /^[a-z0-9_]{3,15}$/.test(username);

    it('should accept valid handles', () => {
      expect(isValidUsername('player_123')).toBe(true);
      expect(isValidUsername('ronaldo_cr7')).toBe(true);
      expect(isValidUsername('ace')).toBe(true);
      expect(isValidUsername('longusername123')).toBe(true); // 15 chars
    });

    it('should reject invalid handles', () => {
      expect(isValidUsername('ab')).toBe(false); // too short
      expect(isValidUsername('toolongusername12345')).toBe(false); // > 15 chars
      expect(isValidUsername('Invalid-Hyphen')).toBe(false);
      expect(isValidUsername('Space Inside')).toBe(false);
      expect(isValidUsername('UPPERCASE')).toBe(false);
    });
  });

  describe('Crockford Base32 & Room Code Generators', () => {
    it('should generate 8-character Crockford codes without confusing letters', () => {
      const code = generateCrockfordCode(8);
      expect(code).toHaveLength(8);
      expect(code).not.toMatch(/[ILOU]/); // Crockford excludes I, L, O, U
    });

    it('should generate 6-character room codes', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
      expect(/^[A-Z0-9]{6}$/.test(code)).toBe(true);
    });
  });

  describe('Session Token & Ownership Verification', () => {
    it('should generate a 72-hex character cryptographically random session token', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).toHaveLength(72);
      expect(token2).toHaveLength(72);
      expect(token1).not.toBe(token2);
    });

    it('should verify matching session token against database record', async () => {
      const mockCtx = {
        db: {
          get: async (id: unknown) => {
            if (id === 'guest_valid') return { _id: 'guest_valid' as Id<'guestUsers'>, sessionToken: 'secret_123' };
            return null;
          },
        },
      };

      // Matching token succeeds
      const result = await verifyGuestSession(
        mockCtx as unknown as Parameters<typeof verifyGuestSession>[0],
        'guest_valid' as Id<'guestUsers'>,
        'secret_123',
      );
      expect(result).toBe(true);

      // Mismatched token throws Error
      await expect(
        verifyGuestSession(mockCtx as unknown as Parameters<typeof verifyGuestSession>[0], 'guest_valid' as Id<'guestUsers'>, 'wrong_token'),
      ).rejects.toThrow('Unauthorized');

      // Missing token throws Error
      await expect(
        verifyGuestSession(mockCtx as unknown as Parameters<typeof verifyGuestSession>[0], 'guest_valid' as Id<'guestUsers'>, undefined),
      ).rejects.toThrow('Unauthorized');

      // Non-existent guest throws Error
      await expect(
        verifyGuestSession(mockCtx as unknown as Parameters<typeof verifyGuestSession>[0], 'guest_unknown' as Id<'guestUsers'>, 'secret_123'),
      ).rejects.toThrow('Unauthorized');
    });

    it('should evaluate isGuestOwner safely without throwing', async () => {
      const mockCtx = {
        db: {
          get: async (id: unknown) => {
            if (id === 'guest_valid') return { _id: 'guest_valid' as Id<'guestUsers'>, sessionToken: 'secret_123' };
            return null;
          },
        },
      };

      expect(await isGuestOwner(mockCtx as unknown as Parameters<typeof isGuestOwner>[0], 'guest_valid' as Id<'guestUsers'>, 'secret_123')).toBe(true);
      expect(await isGuestOwner(mockCtx as unknown as Parameters<typeof isGuestOwner>[0], 'guest_valid' as Id<'guestUsers'>, 'wrong_token')).toBe(false);
      expect(await isGuestOwner(mockCtx as unknown as Parameters<typeof isGuestOwner>[0], 'guest_valid' as Id<'guestUsers'>, undefined)).toBe(false);
      expect(await isGuestOwner(mockCtx as unknown as Parameters<typeof isGuestOwner>[0], null, 'secret_123')).toBe(false);
      expect(await isGuestOwner(mockCtx as unknown as Parameters<typeof isGuestOwner>[0], 'guest_unknown' as Id<'guestUsers'>, 'secret_123')).toBe(false);
    });
  });
});
