import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { tierValidator } from "../lib/constants";
import { LEAGUE_COUNTRY } from "../lib/constants";

/**
 * Seeder mutation for populating clubs, nations, and players into Convex.
 */

const KNOWN_LEAGUES: Record<string, string> = {
  // Premier League
  Arsenal: "Premier League",
  Chelsea: "Premier League",
  Liverpool: "Premier League",
  "Manchester City": "Premier League",
  "Manchester United": "Premier League",
  "Newcastle United": "Premier League",
  Tottenham: "Premier League",
  "Aston Villa": "Premier League",
  "West Ham": "Premier League",
  Brighton: "Premier League",
  Fulham: "Premier League",
  "Crystal Palace": "Premier League",
  "Nottingham Forest": "Premier League",
  Bournemouth: "Premier League",
  Brentford: "Premier League",
  Everton: "Premier League",
  Wolves: "Premier League",
  Leicester: "Premier League",
  Ipswich: "Premier League",
  Southampton: "Premier League",
  // La Liga
  "Real Madrid": "La Liga",
  Barcelona: "La Liga",
  "Atlético Madrid": "La Liga",
  Sevilla: "La Liga",
  "Real Sociedad": "La Liga",
  Villarreal: "La Liga",
  "Real Betis": "La Liga",
  "Athletic Bilbao": "La Liga",
  Valencia: "La Liga",
  Girona: "La Liga",
  Espanyol: "La Liga",
  // Serie A
  "AC Milan": "Serie A",
  "Inter Milan": "Serie A",
  Juventus: "Serie A",
  Napoli: "Serie A",
  Roma: "Serie A",
  Lazio: "Serie A",
  Atalanta: "Serie A",
  Fiorentina: "Serie A",
  // Bundesliga
  "Bayern Munich": "Bundesliga",
  "Borussia Dortmund": "Bundesliga",
  "Bayer Leverkusen": "Bundesliga",
  "RB Leipzig": "Bundesliga",
  "Eintracht Frankfurt": "Bundesliga",
  "VfB Stuttgart": "Bundesliga",
  // Ligue 1
  PSG: "Ligue 1",
  "Paris Saint-Germain": "Ligue 1",
  Monaco: "Ligue 1",
  Lyon: "Ligue 1",
  Marseille: "Ligue 1",
  Lille: "Ligue 1",
};

function inferLeague(club: string, customLeague?: string): string {
  if (customLeague?.trim()) return customLeague.trim();
  return KNOWN_LEAGUES[club] ?? "Global Legends";
}

/** FIX: Derive club country from league, not player nationality. */
function inferCountry(league: string, playerNation: string): string {
  return LEAGUE_COUNTRY[league] ?? playerNation;
}

export const seedAllData = mutation({
  args: {
    players: v.array(
      v.object({
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
    const clubMap = new Map<string, any>();
    const nationMap = new Map<string, any>();

    for (const p of args.players) {
      if (!clubMap.has(p.club)) {
        const league = inferLeague(p.club, p.league);
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
        seasonYear: p.seasonYear,
        apiId: p.apiId,
        imageUrl: p.imageUrl,
        kitNumber: p.kitNumber,
      });
      count++;
    }

    return { success: true, seededPlayers: count, clubs: clubMap.size, nations: nationMap.size };
  },
});
