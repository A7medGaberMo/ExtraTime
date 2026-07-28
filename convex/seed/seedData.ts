import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Seeder mutation for populating clubs, nations, and players into Convex.
 */

const PREMIER_LEAGUE_CLUBS = new Set([
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
]);

function inferLeague(club: string) {
  return PREMIER_LEAGUE_CLUBS.has(club) ? "Premier League" : "Global Legends";
}

export const seedAllData = mutation({
  args: {
    players: v.array(
      v.object({
        name: v.string(),
        position: v.string(),
        club: v.string(),
        nation: v.string(),
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
    ),
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

    // 2. Cache clubs and nations
    const clubMap = new Map();
    const nationMap = new Map();

    for (const p of args.players) {
      if (!clubMap.has(p.club)) {
        const clubId = await ctx.db.insert("clubs", {
          name: p.club,
          shortName: p.club.slice(0, 3).toUpperCase(),
          logo: `logos/clubs/${p.club.toLowerCase().replace(/\s+/g, '-')}.png`,
          league: inferLeague(p.club),
          country: p.nation,
          apiId: ""
        });
        clubMap.set(p.club, clubId);
      }

      if (!nationMap.has(p.nation)) {
        const nationId = await ctx.db.insert("nations", {
          name: p.nation,
          code: p.nation.slice(0, 2).toUpperCase(),
          flag: `logos/nations/${p.nation.toLowerCase().replace(/\s+/g, '-')}.png`,
          confederation: "FIFA",
          apiId: ""
        });
        nationMap.set(p.nation, nationId);
      }
    }

    // 3. Insert players
    let count = 0;
    for (const p of args.players) {
      const clubId = clubMap.get(p.club);
      const nationId = nationMap.get(p.nation);

      await ctx.db.insert("players", {
        name: p.name,
        position: p.position,
        clubId,
        nationId,
        tier: p.tier,
        isLegend: p.isLegend,
        seasonYear: p.seasonYear ?? 2024,
        apiId: p.apiId,
        imageUrl: p.imageUrl,
        kitNumber: p.kitNumber,
      });
      count++;
    }

    return { success: true, seededPlayers: count, clubs: clubMap.size, nations: nationMap.size };
  },
});
