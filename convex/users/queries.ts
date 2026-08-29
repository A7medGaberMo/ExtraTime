import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from '../lib/identity';
import { isProfane, isReservedHandle } from '../lib/profanity';

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const cleanUsername = args.username.trim().toLowerCase();
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', cleanUsername))
      .unique();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarSeed: user.avatarSeed,
      bio: user.bio,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  },
});

export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarSeed: user.avatarSeed,
      bio: user.bio,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
    };
  },
});

export const checkUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const clean = args.username.trim().toLowerCase();

    if (clean.length < 3 || clean.length > 15) {
      return { available: false, reason: 'Username must be 3-15 characters' };
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      return { available: false, reason: 'Only lowercase letters, numbers, and _ allowed' };
    }
    if (isReservedHandle(clean)) {
      return { available: false, reason: 'Username is reserved' };
    }
    if (isProfane(clean)) {
      return { available: false, reason: 'Username contains prohibited words' };
    }

    const currentUser = await getCurrentUser(ctx);
    if (currentUser && currentUser.username === clean) {
      return { available: true, isCurrent: true };
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', clean))
      .unique();

    return { available: !existing };
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clean = args.query.trim().toLowerCase();
    if (clean.length < 2) return [];

    const currentUser = await getCurrentUser(ctx);
    const limit = Math.min(args.limit || 10, 20);

    const results = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.gte('username', clean).lte('username', clean + '\uffff'))
      .take(limit + 5);

    return results
      .filter((u) => !currentUser || u._id !== currentUser._id)
      .slice(0, limit)
      .map((u) => ({
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        avatarSeed: u.avatarSeed,
      }));
  },
});
