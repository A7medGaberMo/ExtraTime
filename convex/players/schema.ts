import { defineTable } from "convex/server";
import { v } from "convex/values";

export const playersTable = defineTable({
  name: v.string(),
  position: v.string(), // Supports FC-style multi-position values like "CDM/CM" or "LW/ST".
  clubId: v.id("clubs"),
  nationId: v.id("nations"),
  tier: v.union(
    v.literal("ICON"),
    v.literal("HERO"),
    v.literal("ULTIMATE"),
    v.literal("MASTER"),
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
  .index("by_season", ["seasonYear"])
  .index("by_apiId", ["apiId"])
  .index("by_name", ["name"])
  .index("by_club_tier", ["clubId", "tier"])
  .index("by_nation_tier", ["nationId", "tier"])
  .index("by_legend_tier", ["isLegend", "tier"])
  .index("by_tier_season", ["tier", "seasonYear"]);
