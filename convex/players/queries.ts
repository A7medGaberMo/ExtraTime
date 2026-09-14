import { query } from '../_generated/server';
import { v } from 'convex/values';
import { GenericQueryCtx, paginationOptsValidator } from 'convex/server';
import { DataModel, Doc, Id } from '../_generated/dataModel';
import { Tier } from '../lib/constants';

// ── Batch Hydration Helper ───────────────────────────────────

/**
 * Batch-hydrates a list of players by collecting unique club & nation IDs
 * and fetching them in parallel. Reduces DB read operations by >85%.
 */
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
      ...p,
      club: club?.name ?? 'Unknown Club',
      clubLogo: club?.logo ?? '',
      nation: nation?.name ?? 'Unknown Nation',
      nationFlag: nation?.flag ?? '',
    };
  });
}

async function hydrateSinglePlayer(ctx: GenericQueryCtx<DataModel>, p: Doc<'players'>) {
  const [hydrated] = await hydratePlayers(ctx, [p]);
  return hydrated;
}

// ── Queries ────────────────────────────────────────────────

export const getAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const players = await ctx.db.query('players').take(limit);
    return hydratePlayers(ctx, players);
  },
});

export const getPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query('players').paginate(args.paginationOpts);
    const hydratedPage = await hydratePlayers(ctx, page.page);
    return {
      ...page,
      page: hydratedPage,
    };
  },
});

export const getById = query({
  args: { id: v.id('players') },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) return null;
    return hydrateSinglePlayer(ctx, p);
  },
});

export const getByTier = query({
  args: {
    tier: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const players = await ctx.db
      .query('players')
      .withIndex('by_tier', (q) => q.eq('tier', args.tier as Tier))
      .take(limit);
    return hydratePlayers(ctx, players);
  },
});

export const getByTierPaginated = query({
  args: {
    tier: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query('players')
      .withIndex('by_tier', (q) => q.eq('tier', args.tier as Tier))
      .paginate(args.paginationOpts);
    const hydratedPage = await hydratePlayers(ctx, page.page);
    return {
      ...page,
      page: hydratedPage,
    };
  },
});

export const getByPosition = query({
  args: {
    position: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const target = args.position.trim().toUpperCase();
    const limit = args.limit ?? 50;

    // 1. Try direct exact match on indexed position
    const exactMatches = await ctx.db
      .query('players')
      .withIndex('by_position', (q) => q.eq('position', target))
      .take(limit);

    if (exactMatches.length >= limit) {
      return hydratePlayers(ctx, exactMatches);
    }

    const matchedMap = new Map<string, Doc<'players'>>();
    for (const p of exactMatches) {
      matchedMap.set(String(p._id), p);
    }

    // 2. Fetch candidates with bound to match multi-position slash strings (e.g., "ST/LW")
    const candidates = await ctx.db.query('players').take(300);
    for (const player of candidates) {
      if (matchedMap.size >= limit) break;
      if (matchedMap.has(String(player._id))) continue;

      const positions = player.position.split('/').map((pos) => pos.trim().toUpperCase());

      if (positions.includes(target)) {
        matchedMap.set(String(player._id), player);
      }
    }

    return hydratePlayers(ctx, Array.from(matchedMap.values()));
  },
});

/**
 * Database Stats Query.
 * Returns counts of players, clubs, and nations.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query('players').collect();
    const clubs = await ctx.db.query('clubs').collect();
    const nations = await ctx.db.query('nations').collect();

    return {
      totalPlayers: players.length,
      totalClubs: clubs.length,
      totalNations: nations.length,
    };
  },
});

/**
 * Full-database player search query.
 * Searches across name, club, nation, position, and tier with accent/diacritics normalization.
 */
export const searchPlayers = query({
  args: {
    query: v.string(),
    tier: v.optional(v.string()),
    position: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const raw = args.query.trim();
    if (!raw && !args.tier && !args.position) return [];

    const limit = Math.min(args.limit ?? 40, 80);

    const norm = (s: string) =>
      (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const q = norm(raw);

    const [allPlayers, allClubs, allNations] = await Promise.all([
      ctx.db.query('players').collect(),
      ctx.db.query('clubs').collect(),
      ctx.db.query('nations').collect(),
    ]);

    const clubMap = new Map<string, string>();
    for (const c of allClubs) clubMap.set(String(c._id), norm(c.name));

    const nationMap = new Map<string, string>();
    for (const n of allNations) nationMap.set(String(n._id), norm(n.name));

    const matches: Doc<'players'>[] = [];
    for (const p of allPlayers) {
      if (matches.length >= limit) break;

      // Tier filter
      if (args.tier && args.tier !== 'ALL' && p.tier !== args.tier) {
        continue;
      }

      // Position category filter
      if (args.position && args.position !== 'ALL') {
        const pPos = p.position.toUpperCase();
        if (args.position === 'FWD' && !['ST', 'CF', 'LW', 'RW', 'SS'].some((pos) => pPos.includes(pos))) continue;
        if (args.position === 'MID' && !['CM', 'CAM', 'CDM', 'LM', 'RM'].some((pos) => pPos.includes(pos))) continue;
        if (args.position === 'DEF' && !['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'].some((pos) => pPos.includes(pos))) continue;
        if (args.position === 'GK' && !pPos.includes('GK')) continue;
      }

      // Text query match
      if (q) {
        const pName = norm(p.name);
        const pPos = norm(p.position);
        const pTier = norm(p.tier);
        const cName = p.clubId ? (clubMap.get(String(p.clubId)) ?? '') : '';
        const nName = p.nationId ? (nationMap.get(String(p.nationId)) ?? '') : '';

        const matched =
          pName.includes(q) ||
          cName.includes(q) ||
          nName.includes(q) ||
          pPos.includes(q) ||
          pTier.includes(q);

        if (!matched) continue;
      }

      matches.push(p);
    }

    // Sort by rating descending (highest stars first)
    matches.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return hydratePlayers(ctx, matches);
  },
});
