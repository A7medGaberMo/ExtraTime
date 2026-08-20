import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id, DataModel } from '../_generated/dataModel';
import { GenericQueryCtx } from 'convex/server';

async function hydratePlayerIds(ctx: GenericQueryCtx<DataModel>, playerIds: Id<'players'>[]) {
  return Promise.all(
    playerIds.map(async (id) => {
      const p = await ctx.db.get(id);
      if (!p) return null;
      const [club, nation] = await Promise.all([ctx.db.get(p.clubId), ctx.db.get(p.nationId)]);
      return {
        ...p,
        club: club?.name ?? 'Unknown Club',
        nation: nation?.name ?? 'Unknown Nation',
      };
    }),
  );
}

export const getByRoom = query({
  args: { roomId: v.id('rooms') },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query('matches')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();
    if (!match) return null;

    const [hostSquad, guestSquad] = await Promise.all([
      hydratePlayerIds(ctx, match.hostSquad),
      hydratePlayerIds(ctx, match.guestSquad),
    ]);

    return {
      ...match,
      hostSquadDetails: hostSquad,
      guestSquadDetails: guestSquad,
    };
  },
});

export const getById = query({
  args: { id: v.id('matches') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
