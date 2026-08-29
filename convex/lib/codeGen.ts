import { GenericMutationCtx } from 'convex/server';
import { DataModel } from '../_generated/dataModel';

/**
 * Generates an 8-character Crockford Base32 invite code (excluding easily confused letters I, L, O, U).
 */
export function generateCrockfordCode(length = 8): string {
  const chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generates a 6-character room code.
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generates a unique room code for Snipe rooms.
 */
export async function generateUniqueRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const existing = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique room code');
}

/**
 * Generates a unique room code for Rank games.
 */
export async function generateUniqueRankRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const existing = await ctx.db
      .query('rankGames')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique rank room code');
}

/**
 * Randomly assigns SCOUT or SPY perk for Hidden Bid matches.
 */
export function randomPerk(): 'SCOUT' | 'SPY' {
  return Math.random() < 0.5 ? 'SCOUT' : 'SPY';
}

/**
 * Deterministic room seed — drives tie lotteries + the match simulation.
 */
export function generateRoomSeed(): string {
  const rand =
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2);
  return rand.slice(0, 16);
}
