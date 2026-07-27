import { defineTable } from "convex/server";
import { v } from "convex/values";

export const roomsTable = defineTable({
  code: v.string(),
  hostId: v.id("guestUsers"),
  guestId: v.optional(v.id("guestUsers")),
  gameType: v.string(),
  status: v.union(
    v.literal("waiting"),
    v.literal("ready"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("abandoned")
  ),
  settings: v.any(),
  createdAt: v.number(),
})
  .index("by_code", ["code"])
  .index("by_status", ["status"])
  .index("by_host", ["hostId"]);
