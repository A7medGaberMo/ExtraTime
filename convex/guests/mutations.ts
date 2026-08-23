import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { generateSessionToken } from '../lib/auth';

export const create = mutation({
  args: {
    nickname: v.string(),
    avatarSeed: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionToken = generateSessionToken();
    const guestId = await ctx.db.insert('guestUsers', {
      ...args,
      sessionToken,
      createdAt: now,
      lastActiveAt: now,
    });
    return { guestId, sessionToken };
  },
});

export const ensure = mutation({
  args: {
    existingId: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    nickname: v.string(),
    avatarSeed: v.string(),
  },
  handler: async (ctx, args) => {
    const existingId = args.existingId
      ? ctx.db.normalizeId('guestUsers', args.existingId)
      : null;

    if (existingId && args.sessionToken) {
      const existing = await ctx.db.get(existingId);

      if (existing && existing.sessionToken && existing.sessionToken === args.sessionToken) {
        await ctx.db.patch(existingId, {
          lastActiveAt: Date.now(),
          nickname: args.nickname.trim().slice(0, 24) || existing.nickname,
        });
        return { guestId: existingId, sessionToken: existing.sessionToken };
      }
    }


    const now = Date.now();
    const sessionToken = generateSessionToken();
    const newId = await ctx.db.insert('guestUsers', {
      nickname: args.nickname,
      avatarSeed: args.avatarSeed,
      sessionToken,
      createdAt: now,
      lastActiveAt: now,
    });

    return { guestId: newId, sessionToken };
  },
});

export const updateLastActive = mutation({
  args: { id: v.id('guestUsers') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastActiveAt: Date.now() });
  },
});
