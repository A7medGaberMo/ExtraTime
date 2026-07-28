import { defineTable } from "convex/server";
import { v } from "convex/values";

export const matchesTable = defineTable({
  roomId: v.id("rooms"),
  hostSquad: v.array(v.id("players")),
  guestSquad: v.array(v.id("players")),
  winnerId: v.optional(v.id("guestUsers")),
  score: v.object({
    host: v.number(),
    guest: v.number(),
  }),
  status: v.union(
    v.literal("pending"),
    v.literal("simulating"),
    v.literal("completed")
  ),
  completedAt: v.optional(v.number()),
}).index("by_room", ["roomId"]);
