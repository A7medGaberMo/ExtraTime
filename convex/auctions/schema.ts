import { defineTable } from "convex/server";
import { v } from "convex/values";

export const auctionsTable = defineTable({
  roomId: v.id("rooms"),
  rounds: v.array(v.any()), // array of round data
  currentRound: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed")
  ),
  createdAt: v.number(),
});
