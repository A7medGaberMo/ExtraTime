import { mutation } from "../_generated/server";
import { Doc } from "../_generated/dataModel";
import { v } from "convex/values";
import { tierValidator } from "../lib/constants";

export const create = mutation({
  args: {
    name: v.string(),
    position: v.string(),
    clubId: v.id("clubs"),
    nationId: v.id("nations"),
    tier: tierValidator,
    isLegend: v.boolean(),
    seasonYear: v.optional(v.number()),
    apiId: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    kitNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("players", {
      name: args.name,
      position: args.position,
      clubId: args.clubId,
      nationId: args.nationId,
      tier: args.tier,
      isLegend: args.isLegend,
      seasonYear: args.seasonYear,
      apiId: args.apiId,
      imageUrl: args.imageUrl,
      kitNumber: args.kitNumber,
    });
  },
});

export const bulkUpdatePlayerImages = mutation({
  args: {
    updates: v.array(
      v.object({
        name: v.string(),
        apiId: v.optional(v.string()),
        imageUrl: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Collect all legend players once (only ~165 reads total!)
    const allLegends = await ctx.db
      .query("players")
      .withIndex("by_legend", (q) => q.eq("isLegend", true))
      .collect();

    const byApiIdMap = new Map<string, Doc<"players">>();
    const byNameMap = new Map<string, Doc<"players">>();

    for (const p of allLegends) {
      if (p.apiId) byApiIdMap.set(p.apiId, p);
      byNameMap.set(p.name, p);
    }

    let updated = 0;
    for (const item of args.updates) {
      const player = (item.apiId ? byApiIdMap.get(item.apiId) : null) || byNameMap.get(item.name);
      if (player) {
        await ctx.db.patch(player._id, { imageUrl: item.imageUrl });
        updated++;
      }
    }
    return { success: true, updated };
  },
});

/**
 * Deduplicate player records in Convex.
 * Finds duplicated player rows, preserves the best record (with valid image / apiId / details),
 * and removes redundant duplicates.
 */
export const deduplicatePlayers = mutation({
  args: {},
  handler: async (ctx) => {
    const allPlayers = await ctx.db.query("players").collect();
    const groups = new Map<string, Doc<"players">[]>();

    for (const p of allPlayers) {
      // Key by apiId if available, otherwise by normalized name + isLegend flag
      const key = p.apiId && p.apiId.trim() !== ""
        ? `api:${p.apiId.trim()}`
        : `name:${p.name.toLowerCase().trim()}_${p.isLegend ? "legend" : "active"}`;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    }

    let deletedCount = 0;
    let duplicatesFound = 0;

    for (const [key, group] of groups.entries()) {
      if (group.length <= 1) continue;

      duplicatesFound += group.length - 1;

      // Score documents to find the most complete one to keep
      const scored = group.map((doc) => {
        let score = 0;
        if (doc.imageUrl && !doc.imageUrl.includes("Photo-Missing") && doc.imageUrl.trim() !== "") score += 10;
        if (doc.apiId && doc.apiId.trim() !== "") score += 5;
        if (doc.kitNumber !== undefined && doc.kitNumber > 0) score += 2;
        if (doc.seasonYear !== undefined) score += 1;
        return { doc, score };
      });

      scored.sort((a, b) => b.score - a.score || b.doc._creationTime - a.doc._creationTime);
      const keeper = scored[0].doc;
      const toDelete = scored.slice(1);

      // Merge any missing fields from duplicates into the keeper
      const patchPayload: Partial<Doc<"players">> = {};
      for (const item of toDelete) {
        if (!keeper.imageUrl && item.doc.imageUrl) patchPayload.imageUrl = item.doc.imageUrl;
        if (!keeper.apiId && item.doc.apiId) patchPayload.apiId = item.doc.apiId;
        if (!keeper.kitNumber && item.doc.kitNumber) patchPayload.kitNumber = item.doc.kitNumber;
      }
      if (Object.keys(patchPayload).length > 0) {
        await ctx.db.patch(keeper._id, patchPayload);
      }

      // Delete the redundant duplicate rows
      for (const item of toDelete) {
        await ctx.db.delete(item.doc._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      totalPlayersChecked: allPlayers.length,
      duplicatesFound,
      deletedCount,
      uniquePlayersRemaining: allPlayers.length - deletedCount,
    };
  },
});

