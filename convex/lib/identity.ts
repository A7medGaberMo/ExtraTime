import { MutationCtx, QueryCtx } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { verifyGuestSession } from './auth';

/**
 * Validates Clerk authentication for user-scoped platform features.
 * Automatically provisions a default user record on the player's first authenticated mutation.
 */
export async function requireUser(ctx: MutationCtx | QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Unauthorized: Authentication required');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (user) {
    return user;
  }

  if ('insert' in ctx.db) {
    const identityObj = identity as { preferredUsername?: string; email?: string };
    const userId = await provisionDefaultUser(
      ctx as MutationCtx,
      identity.subject,
      identity.name ||
        identity.givenName ||
        identity.nickname ||
        identityObj.preferredUsername ||
        identityObj.email?.split('@')[0],
    );
    const newUser = await ctx.db.get(userId);
    if (!newUser) {
      throw new Error('Failed to retrieve provisioned user profile');
    }
    return newUser;
  }

  throw new Error('Unauthorized: User profile initializing');
}

/**
 * Returns current authenticated user record, or null if logged out / unauthenticated.
 * Safe for use inside public queries.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
    .unique();
}

/**
 * Provisions a fresh user record with a randomized unique handle and avatar.
 */
export async function provisionDefaultUser(
  ctx: MutationCtx,
  clerkId: string,
  suggestedName?: string,
): Promise<Id<'users'>> {
  const now = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const cleanBase = (suggestedName || 'player')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 10);
  let username = `${cleanBase || 'player'}_${rand}`;

  // Ensure username is strictly unique with bounded retries
  let collision = await ctx.db
    .query('users')
    .withIndex('by_username', (q) => q.eq('username', username))
    .unique();

  let attempt = 0;
  while (collision && attempt < 10) {
    attempt++;
    const newRand = Math.floor(1000 + Math.random() * 9000);
    username = `${cleanBase || 'player'}_${newRand}`;
    collision = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .unique();
  }

  if (collision) {
    username = `${cleanBase || 'player'}_${Date.now().toString(36)}`;
  }

  return await ctx.db.insert('users', {
    clerkId,
    username,
    displayName: suggestedName?.trim().slice(0, 24) || `Player ${rand}`,
    avatarSeed: `seed-${(rand % 12) + 1}`,
    profileComplete: false,
    createdAt: now,
    lastActiveAt: now,
  });
}

/**
 * Validates legacy guest session for casual games (rooms, auctions, casual rank).
 * Guarantees zero regressions to existing casual multiplayer games.
 */
export async function resolveLegacyGuest(
  ctx: MutationCtx | QueryCtx,
  args: { guestId: Id<'guestUsers'>; sessionToken?: string },
): Promise<Id<'guestUsers'>> {
  if (!args.guestId) {
    throw new Error('Unauthorized: Guest ID missing');
  }
  await verifyGuestSession(ctx as MutationCtx, args.guestId, args.sessionToken);
  return args.guestId;
}
