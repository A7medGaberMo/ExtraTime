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

export const updateLastActive = mutation({
  args: { id: v.id('guestUsers') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastActiveAt: Date.now() });
  },
});
