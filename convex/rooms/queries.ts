import { query } from "../_generated/server";
import { v } from "convex/values";

type PoolMode = "GLOBAL" | "EPL" | "ICONS";
type PublicQueueSummary = Record<PoolMode, Record<5 | 11, number>>;

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    return await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("rooms") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPublicQueueSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_public_status", (q) => q.eq("isPublic", true).eq("status", "waiting"))
      .collect();

    const freshRooms = rooms.filter((room) => room.createdAt > now - 10 * 60 * 1000);
    const queues: PublicQueueSummary = {
      GLOBAL: { 5: 0, 11: 0 },
      EPL: { 5: 0, 11: 0 },
      ICONS: { 5: 0, 11: 0 },
    };

    for (const room of freshRooms) {
      const poolMode = room.settings?.poolMode || "GLOBAL";
      const matchSize = room.settings?.matchSize;
      if ((poolMode === "GLOBAL" || poolMode === "EPL" || poolMode === "ICONS") && (matchSize === 5 || matchSize === 11)) {
        queues[poolMode as PoolMode][matchSize as 5 | 11] += 1;
      }
    }

    return {
      totalWaiting: freshRooms.length,
      queues,
    };
  },
});
