import { mutation, type MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { tierValidator, LEAGUE_COUNTRY, type Tier } from "../lib/constants";

/**
 * Seeder mutation for populating clubs, nations, and players into Convex.
 */

/** Derive club country from league. */
function inferCountry(league: string, playerNation: string): string {
  return LEAGUE_COUNTRY[league] ?? playerNation;
}

const playerArg = v.object({
  name: v.string(),
  position: v.string(),
  club: v.string(),
  nation: v.string(),
  league: v.optional(v.string()),
  tier: tierValidator,
  isLegend: v.boolean(),
  seasonYear: v.optional(v.number()),
  apiId: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  kitNumber: v.optional(v.number()),
});

/**
 * seedAllData — clears the entire DB first, then inserts players.
 * Used for the first batch.
 */
export const seedAllData = mutation({
  args: {
    players: v.array(playerArg),
  },
  handler: async (ctx, args) => {
    // 1. Clear existing database
    const existingPlayers = await ctx.db.query("players").collect();
    for (const p of existingPlayers) {
      await ctx.db.delete(p._id);
    }
    const existingClubs = await ctx.db.query("clubs").collect();
    for (const c of existingClubs) {
      await ctx.db.delete(c._id);
    }
    const existingNations = await ctx.db.query("nations").collect();
    for (const n of existingNations) {
      await ctx.db.delete(n._id);
    }

    // 2. Insert this batch
    return await insertPlayers(ctx, args.players);
  },
});

/**
 * appendData — inserts additional players without clearing.
 * Used for subsequent batches after seedAllData.
 */
export const appendData = mutation({
  args: {
    players: v.array(playerArg),
  },
  handler: async (ctx, args) => {
    return await insertPlayers(ctx, args.players);
  },
});

/** Shared insertion logic used by both seedAllData and appendData. */
async function insertPlayers(
  ctx: MutationCtx,
  players: Array<{
    name: string;
    position: string;
    club: string;
    nation: string;
    league?: string;
    tier: string;
    isLegend: boolean;
    seasonYear?: number;
    apiId?: string;
    imageUrl?: string;
    kitNumber?: number;
  }>
) {
  // Load existing clubs/nations (from previous batches) to avoid duplicates
  const existingClubs = await ctx.db.query("clubs").collect();
  const clubMap = new Map<string, Id<"clubs">>();
  for (const c of existingClubs) {
    clubMap.set(c.name, c._id);
  }

  const existingNations = await ctx.db.query("nations").collect();
  const nationMap = new Map<string, Id<"nations">>();
  for (const n of existingNations) {
    nationMap.set(n.name, n._id);
  }

  for (const p of players) {
    const league = p.league?.trim() || "Global Legends";

    if (!clubMap.has(p.club)) {
      const clubId = await ctx.db.insert("clubs", {
        name: p.club,
        shortName: p.club.slice(0, 3).toUpperCase(),
        logo: `logos/clubs/${p.club.toLowerCase().replace(/\s+/g, "-")}.png`,
        league,
        country: inferCountry(league, p.nation),
        apiId: "",
      });
      clubMap.set(p.club, clubId);
    }

    if (!nationMap.has(p.nation)) {
      const nationId = await ctx.db.insert("nations", {
        name: p.nation,
        code: p.nation.slice(0, 2).toUpperCase(),
        flag: `logos/nations/${p.nation.toLowerCase().replace(/\s+/g, "-")}.png`,
        confederation: "FIFA",
        apiId: "",
      });
      nationMap.set(p.nation, nationId);
    }
  }

  // Insert players
  let count = 0;
  for (const p of players) {
    const clubId = clubMap.get(p.club);
    const nationId = nationMap.get(p.nation);
    if (!clubId || !nationId) continue;

    await ctx.db.insert("players", {
      name: p.name,
      position: p.position,
      clubId,
      nationId,
      tier: p.tier as Tier,
      isLegend: p.isLegend,
      seasonYear: p.seasonYear,
      apiId: p.apiId,
      imageUrl: p.imageUrl,
      kitNumber: p.kitNumber,
    });
    count++;
  }

  return { success: true, seededPlayers: count, clubs: clubMap.size, nations: nationMap.size };
}

/**
 * upsertLegendsBatch — upserts legend players into Convex without affecting active non-legend players.
 */
export const upsertLegendsBatch = mutation({
  args: {
    players: v.array(playerArg),
  },
  handler: async (ctx, args) => {
    const existingClubs = await ctx.db.query("clubs").collect();
    const clubMap = new Map<string, Id<"clubs">>();
    for (const c of existingClubs) {
      clubMap.set(c.name, c._id);
    }

    const existingNations = await ctx.db.query("nations").collect();
    const nationMap = new Map<string, Id<"nations">>();
    for (const n of existingNations) {
      nationMap.set(n.name, n._id);
    }

    let upsertedCount = 0;

    for (const p of args.players) {
      const league = p.league?.trim() || "Global Legends";

      if (!clubMap.has(p.club)) {
        const clubId = await ctx.db.insert("clubs", {
          name: p.club,
          shortName: p.club.slice(0, 3).toUpperCase(),
          logo: `logos/clubs/${p.club.toLowerCase().replace(/\s+/g, "-")}.png`,
          league,
          country: inferCountry(league, p.nation),
          apiId: "",
        });
        clubMap.set(p.club, clubId);
      }

      if (!nationMap.has(p.nation)) {
        const nationId = await ctx.db.insert("nations", {
          name: p.nation,
          code: p.nation.slice(0, 2).toUpperCase(),
          flag: `logos/nations/${p.nation.toLowerCase().replace(/\s+/g, "-")}.png`,
          confederation: "FIFA",
          apiId: "",
        });
        nationMap.set(p.nation, nationId);
      }

      const clubId = clubMap.get(p.club)!;
      const nationId = nationMap.get(p.nation)!;

      // Find by apiId or by name if legend
      let existing = null;
      if (p.apiId) {
        existing = await ctx.db
          .query("players")
          .withIndex("by_apiId", (q) => q.eq("apiId", p.apiId))
          .first();
      }
      if (!existing) {
        existing = await ctx.db
          .query("players")
          .withIndex("by_name", (q) => q.eq("name", p.name))
          .first();
      }

      const payload = {
        name: p.name,
        position: p.position,
        clubId,
        nationId,
        tier: p.tier as Tier,
        isLegend: true,
        seasonYear: p.seasonYear,
        apiId: p.apiId,
        imageUrl: p.imageUrl,
        kitNumber: p.kitNumber,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("players", payload);
      }
      upsertedCount++;
    }

    return { success: true, count: upsertedCount };
  },
});

/**
 * upsertPlayersBatch — universal upsert mutation for ALL players (active and legends).
 */
export const upsertPlayersBatch = mutation({
  args: {
    players: v.array(playerArg),
  },
  handler: async (ctx, args) => {
    const existingClubs = await ctx.db.query("clubs").collect();
    const clubMap = new Map<string, Id<"clubs">>();
    for (const c of existingClubs) {
      clubMap.set(c.name, c._id);
    }

    const existingNations = await ctx.db.query("nations").collect();
    const nationMap = new Map<string, Id<"nations">>();
    for (const n of existingNations) {
      nationMap.set(n.name, n._id);
    }

    let upsertedCount = 0;

    for (const p of args.players) {
      const league = p.league?.trim() || "Global";

      if (!clubMap.has(p.club)) {
        const clubId = await ctx.db.insert("clubs", {
          name: p.club,
          shortName: p.club.slice(0, 3).toUpperCase(),
          logo: `logos/clubs/${p.club.toLowerCase().replace(/\s+/g, "-")}.png`,
          league,
          country: inferCountry(league, p.nation),
          apiId: "",
        });
        clubMap.set(p.club, clubId);
      }

      if (!nationMap.has(p.nation)) {
        const nationId = await ctx.db.insert("nations", {
          name: p.nation,
          code: p.nation.slice(0, 2).toUpperCase(),
          flag: `logos/nations/${p.nation.toLowerCase().replace(/\s+/g, "-")}.png`,
          confederation: "FIFA",
          apiId: "",
        });
        nationMap.set(p.nation, nationId);
      }

      const clubId = clubMap.get(p.club)!;
      const nationId = nationMap.get(p.nation)!;

      let existing = null;
      if (p.apiId) {
        existing = await ctx.db
          .query("players")
          .withIndex("by_apiId", (q) => q.eq("apiId", p.apiId))
          .first();
      }
      if (!existing) {
        existing = await ctx.db
          .query("players")
          .withIndex("by_name", (q) => q.eq("name", p.name))
          .first();
      }

      const payload = {
        name: p.name,
        position: p.position,
        clubId,
        nationId,
        tier: p.tier as Tier,
        isLegend: p.isLegend,
        seasonYear: p.seasonYear,
        apiId: p.apiId,
        imageUrl: p.imageUrl,
        kitNumber: p.kitNumber,
      };

      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("players", payload);
      }
      upsertedCount++;
    }

    return { success: true, count: upsertedCount };
  },
});


