import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    flag: v.string(),
    confederation: v.string(),
    apiId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nations", args);
  },
});
