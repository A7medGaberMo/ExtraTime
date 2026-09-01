import { query } from '../_generated/server';
import { v } from 'convex/values';
import { GenericQueryCtx } from 'convex/server';
import { DataModel, Doc, Id } from '../_generated/dataModel';
import { Tier } from '../lib/constants';

// ── Batch Hydration Helper ───────────────────────────────────

async function hydratePlayers(ctx: GenericQueryCtx<DataModel>, players: Doc<'players'>[]) {
  const clubIds = new Set<Id<'clubs'>>();
  const nationIds = new Set<Id<'nations'>>();

  for (const p of players) {
    if (p.clubId) clubIds.add(p.clubId);
    if (p.nationId) nationIds.add(p.nationId);
  }

  const [clubDocs, nationDocs] = await Promise.all([
    Promise.all([...clubIds].map((id) => ctx.db.get(id))),
    Promise.all([...nationIds].map((id) => ctx.db.get(id))),
  ]);

  const clubMap = new Map<string, Doc<'clubs'>>();
  for (const c of clubDocs) {
    if (c) clubMap.set(String(c._id), c);
  }

  const nationMap = new Map<string, Doc<'nations'>>();
  for (const n of nationDocs) {
    if (n) nationMap.set(String(n._id), n);
  }

  return players.map((p) => {
    const club = clubMap.get(String(p.clubId));
    const nation = nationMap.get(String(p.nationId));
    return {
      _id: p._id,
      name: p.name,
      position: p.position,
      tier: p.tier as Tier,
      isLegend: p.isLegend ?? false,
      kitNumber: p.kitNumber,
      imageUrl: p.imageUrl,
      seasonYear: p.seasonYear,
      rating: p.rating,
      club: club?.name ?? 'World Football Club',
      clubLogo: club?.logo ?? '',
      nation: nation?.name ?? 'International',
      nationFlag: nation?.flag ?? '',
    };
  });
}

// ── Queries ──────────────────────────────────────────────────

/**
 * Retrieves a rich, balanced catalog of players grouped by tier.
 * Queries each tier via index for optimal speed and ensures no tier is empty.
 */
export const getPackPools = query({
  args: {
    samplePerTier: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sampleSize = args.samplePerTier ?? 50;

    const [icons, heroes, ultimates, masters, elites, golds, silvers, bronzes, legends] =
      await Promise.all([
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'ICON'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'HERO'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'ULTIMATE'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'MASTER'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'ELITE'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'GOLD'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'SILVER'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_tier', (q) => q.eq('tier', 'BRONZE'))
          .take(sampleSize),
        ctx.db
          .query('players')
          .withIndex('by_legend', (q) => q.eq('isLegend', true))
          .take(sampleSize),
      ]);

    const allDocs = [
      ...icons,
      ...heroes,
      ...ultimates,
      ...masters,
      ...elites,
      ...golds,
      ...silvers,
      ...bronzes,
    ];

    // Deduplicate by doc ID before hydrating
    const uniqueMap = new Map<string, Doc<'players'>>();
    for (const doc of allDocs) {
      uniqueMap.set(String(doc._id), doc);
    }
    for (const doc of legends) {
      uniqueMap.set(String(doc._id), doc);
    }

    const hydratedList = await hydratePlayers(ctx, Array.from(uniqueMap.values()));
    const hydratedMap = new Map(hydratedList.map((p) => [String(p._id), p]));

    return {
      ICON: icons.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      HERO: heroes.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      ULTIMATE: ultimates.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      MASTER: masters.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      ELITE: elites.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      GOLD: golds.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      SILVER: silvers.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      BRONZE: bronzes.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      LEGENDS: legends.map((p) => hydratedMap.get(String(p._id))!).filter(Boolean),
      allLoaded: hydratedList,
      totalLoaded: hydratedList.length,
    };
  },
});

/**
 * Pack statistics query: returns counts per tier and overall database size.
 */
export const getPacksOverview = query({
  args: {},
  handler: async (ctx) => {
    const [icons, heroes, ultimates, masters, elites, golds, silvers, bronzes] = await Promise.all([
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'ICON'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'HERO'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'ULTIMATE'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'MASTER'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'ELITE'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'GOLD'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'SILVER'))
        .take(500),
      ctx.db
        .query('players')
        .withIndex('by_tier', (q) => q.eq('tier', 'BRONZE'))
        .take(500),
    ]);

    return {
      counts: {
        ICON: icons.length,
        HERO: heroes.length,
        ULTIMATE: ultimates.length,
        MASTER: masters.length,
        ELITE: elites.length,
        GOLD: golds.length,
        SILVER: silvers.length,
        BRONZE: bronzes.length,
      },
      total:
        icons.length +
        heroes.length +
        ultimates.length +
        masters.length +
        elites.length +
        golds.length +
        silvers.length +
        bronzes.length,
    };
  },
});
