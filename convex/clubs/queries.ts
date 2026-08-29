import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('clubs').collect();
  },
});

export const getById = query({
  args: { id: v.id('clubs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAvailablePools = query({
  args: {},
  handler: async (ctx) => {
    const clubs = await ctx.db.query('clubs').collect();
    const leagues = Array.from(new Set(clubs.map((c) => c.league).filter(Boolean)));

    const presetPools = [
      { id: 'ACTIVE', label: 'Active — Current Players', type: 'preset' },
      { id: 'GLOBAL', label: 'Global — All + Legends', type: 'preset' },
      { id: 'EPL', label: 'EPL — Prem Only', type: 'preset' },
      { id: 'ICONS', label: 'Icons — Legends', type: 'preset' },
    ];

    const dynamicPools = leagues
      .filter(
        (league) => league !== 'Premier League' && league !== 'Global Legends' && league !== 'EPL',
      )
      .map((league) => ({
        id: league,
        label: `${league} Pool`,
        type: 'league',
      }));

    return [...presetPools, ...dynamicPools];
  },
});

export const searchClubs = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const clubs = await ctx.db.query('clubs').collect();
    const queryStr = (args.search || '').trim().toLowerCase();
    if (!queryStr) return clubs.slice(0, 36);
    return clubs
      .filter(
        (c) =>
          c.name.toLowerCase().includes(queryStr) ||
          c.shortName.toLowerCase().includes(queryStr) ||
          c.league.toLowerCase().includes(queryStr),
      )
      .slice(0, 36);
  },
});
