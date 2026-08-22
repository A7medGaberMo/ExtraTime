import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    nickname: v.string(),
    avatarSeed: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert('guestUsers', {
      ...args,
      createdAt: now,
      lastActiveAt: now,
    });
  },
});

export const ensure = mutation({
  args: {
    existingId: v.optional(v.string()),
    nickname: v.string(),
    avatarSeed: v.string(),
  },
  handler: async (ctx, args) => {
    const existingId = args.existingId
      ? ctx.db.normalizeId('guestUsers', args.existingId)
      : null;

    if (existingId) {
      const existing = await ctx.db.get(existingId);
      if (existing) {
        await ctx.db.patch(existingId, { lastActiveAt: Date.now() });
        return existingId;
      }
    }

    const now = Date.now();
    return await ctx.db.insert('guestUsers', {
      nickname: args.nickname,
      avatarSeed: args.avatarSeed,
      createdAt: now,
      lastActiveAt: now,
    });
  },
});

export const updateLastActive = mutation({
  args: { id: v.id('guestUsers') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastActiveAt: Date.now() });
  },
});
