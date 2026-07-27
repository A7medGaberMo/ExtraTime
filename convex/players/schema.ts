import { defineTable } from "convex/server";
import { v } from "convex/values";

export const playersTable = defineTable({
  name: v.string(),
  position: v.union(
    v.literal("GK"),
    v.literal("CB"),
    v.literal("LB"),
    v.literal("RB"),
    v.literal("CDM"),
    v.literal("CM"),
    v.literal("CAM"),
    v.literal("LW"),
    v.literal("RW"),
    v.literal("ST"),
    v.literal("CF")
  ),
  clubId: v.id("clubs"),
  nationId: v.id("nations"),
  tier: v.union(
    v.literal("ICON"),
    v.literal("MASTER"),
    v.literal("ELITE_PLUS"),
    v.literal("ELITE"),
    v.literal("GOLD"),
    v.literal("SILVER"),
    v.literal("BRONZE")
  ),
  isLegend: v.boolean(),
  seasonYear: v.optional(v.number()),
  apiId: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  kitNumber: v.optional(v.number()),
})
  .index("by_tier", ["tier"])
  .index("by_position", ["position"])
  .index("by_club", ["clubId"])
  .index("by_nation", ["nationId"])
  .index("by_legend", ["isLegend"])
  .index("by_season", ["seasonYear"]);
