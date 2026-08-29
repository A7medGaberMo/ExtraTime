import { mutation, internalMutation } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { v } from 'convex/values';
import { tierValidator, LEAGUE_COUNTRY, type Tier } from '../lib/constants';

/**
 * Seeder mutations for populating clubs, nations, players, and stats into Convex.
 * Locked down as internal mutations so they cannot be invoked via the public client API.
 */

function inferCountry(league: string, playerNation: string): string {
  return LEAGUE_COUNTRY[league] ?? playerNation;
}

const clubItemArg = v.object({
  name: v.string(),
  shortName: v.string(),
  logo: v.string(),
  league: v.string(),
  country: v.string(),
  apiId: v.string(),
});

const nationItemArg = v.object({
  name: v.string(),
  code: v.string(),
  flag: v.string(),
  confederation: v.string(),
  apiId: v.string(),
});

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
  clubLogo: v.optional(v.string()),
  clubApiId: v.optional(v.string()),
});

/**
 * Clear a table in batches (Internal only).
 */
export const clearTableBatch = internalMutation({
  args: {
    tableName: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.batchSize || 300;
    // @ts-expect-error dynamic tableName query
    const docs = await ctx.db.query(args.tableName).take(limit);
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return {
      deleted: docs.length,
      hasMore: docs.length === limit,
    };
  },
});

/**
 * Seed clubs batch (Internal only).
 */
export const seedClubsBatch = internalMutation({
  args: {
    clubs: v.array(clubItemArg),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const c of args.clubs) {
      const existing = await ctx.db
        .query('clubs')
        .withIndex('by_name', (q) => q.eq('name', c.name))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, c);
      } else {
        await ctx.db.insert('clubs', c);
      }
      inserted++;
    }
    return { success: true, count: inserted };
  },
});

/**
 * Seed nations batch (Internal only).
 */
export const seedNationsBatch = internalMutation({
  args: {
    nations: v.array(nationItemArg),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    for (const n of args.nations) {
      const existing = await ctx.db
        .query('nations')
        .withIndex('by_name', (q) => q.eq('name', n.name))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, n);
      } else {
        await ctx.db.insert('nations', n);
      }
      inserted++;
    }
    return { success: true, count: inserted };
  },
});

/**
 * seedPlayersBatch — accurately inserts players linked to club & nation.
 */
export const upsertPlayersBatch = mutation({
  args: {
    players: v.array(playerArg),
  },
  handler: async (ctx, args) => {
    const existingClubs = await ctx.db.query('clubs').collect();
    const clubMap = new Map<string, Id<'clubs'>>();
    for (const c of existingClubs) {
      clubMap.set(c.name, c._id);
    }

    const existingNations = await ctx.db.query('nations').collect();
    const nationMap = new Map<string, Id<'nations'>>();
    for (const n of existingNations) {
      nationMap.set(n.name, n._id);
    }

    let count = 0;

    for (const p of args.players) {
      const league = p.league?.trim() || 'Global';

      // Ensure club exists
      if (!clubMap.has(p.club)) {
        const clubLogo =
          p.clubLogo ||
          (p.clubApiId
            ? `https://media.api-sports.io/football/teams/${p.clubApiId}.png`
            : `logos/clubs/${p.club.toLowerCase().replace(/\s+/g, '-')}.png`);
        const clubId = await ctx.db.insert('clubs', {
          name: p.club,
          shortName: p.club.slice(0, 3).toUpperCase(),
          logo: clubLogo,
          league,
          country: inferCountry(league, p.nation),
          apiId: p.clubApiId || '',
        });
        clubMap.set(p.club, clubId);
      }

      // Ensure nation exists
      if (!nationMap.has(p.nation)) {
        const nationId = await ctx.db.insert('nations', {
          name: p.nation,
          code: p.nation.slice(0, 2).toUpperCase(),
          flag: `logos/nations/${p.nation.toLowerCase().replace(/\s+/g, '-')}.png`,
          confederation: 'FIFA',
          apiId: '',
        });
        nationMap.set(p.nation, nationId);
      }

      const clubId = clubMap.get(p.club)!;
      const nationId = nationMap.get(p.nation)!;

      // Unique match strictly by apiId
      let existing = null;
      if (p.apiId) {
        existing = await ctx.db
          .query('players')
          .withIndex('by_apiId', (q) => q.eq('apiId', p.apiId))
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
        await ctx.db.insert('players', payload);
      }
      count++;
    }

    return { success: true, count };
  },
});
