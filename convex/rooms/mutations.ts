import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    code: v.string(),
    hostId: v.id("guestUsers"),
    gameType: v.string(),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", {
      ...args,
      status: "waiting",
      createdAt: Date.now(),
    });
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.guestId) throw new Error("Room is full");
    
    await ctx.db.patch(args.roomId, {
      guestId: args.guestId,
      status: "ready",
    });
  },
});

export const updateStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("waiting"),
      v.literal("ready"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { status: args.status });
  },
});
