import { internalMutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = internalMutation({
  args: {
    name: v.string(),
    shortName: v.string(),
    logo: v.string(),
    league: v.string(),
    country: v.string(),
    apiId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('clubs', args);
  },
});
