import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireUser } from '../lib/identity';
import { isProfane, isReservedHandle } from '../lib/profanity';

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return await requireUser(ctx);
  },
});

export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
    avatarSeed: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const cleanUsername = args.username.trim().toLowerCase();
    const cleanDisplayName = args.displayName.trim();
    const cleanBio = args.bio?.trim();

    // 1. Username format validation
    if (!/^[a-z0-9_]{3,15}$/.test(cleanUsername)) {
      throw new Error(
        'Username must be between 3 and 15 characters and contain only lowercase letters, numbers, and underscores.',
      );
    }

    // 2. Reserved handles check
    if (isReservedHandle(cleanUsername)) {
      throw new Error('This username is reserved. Please choose another one.');
    }

    // 3. Profanity moderation
    if (isProfane(cleanUsername)) {
      throw new Error('Username contains prohibited words.');
    }
    if (cleanDisplayName.length < 1 || cleanDisplayName.length > 24) {
      throw new Error('Display name must be between 1 and 24 characters.');
    }
    if (isProfane(cleanDisplayName)) {
      throw new Error('Display name contains prohibited words.');
    }
    if (cleanBio && cleanBio.length > 100) {
      throw new Error('Bio must not exceed 100 characters.');
    }
    if (cleanBio && isProfane(cleanBio)) {
      throw new Error('Bio contains prohibited words.');
    }

    // 4. Uniqueness check if username changed
    if (cleanUsername !== user.username) {
      const existing = await ctx.db
        .query('users')
        .withIndex('by_username', (q) => q.eq('username', cleanUsername))
        .unique();

      if (existing && existing._id !== user._id) {
        throw new Error('This username is already taken.');
      }
    }

    // 5. Apply profile patch
    await ctx.db.patch(user._id, {
      displayName: cleanDisplayName,
      username: cleanUsername,
      avatarSeed: args.avatarSeed,
      bio: cleanBio || undefined,
      profileComplete: true,
      lastActiveAt: Date.now(),
    });

    return { success: true };
  },
});

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { lastActiveAt: Date.now() });
    }
  },
});
