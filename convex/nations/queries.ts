import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('nations').collect();
  },
});

export const getById = query({
  args: { id: v.id('nations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
