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
