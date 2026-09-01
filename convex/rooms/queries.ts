import { query } from '../_generated/server';
import { v } from 'convex/values';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'TOP_TEAMS' | 'ICONS';
type PublicQueueSummary = Record<PoolMode, Record<5 | 11, number>>;

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const code = args.code.trim().toUpperCase();
    return await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
  },
});

export const getById = query({
  args: { id: v.id('rooms') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getPublicQueueSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rooms = await ctx.db
      .query('rooms')
      .withIndex('by_public_status', (q) => q.eq('isPublic', true).eq('status', 'waiting'))
      .take(100);

    const freshRooms = rooms.filter((room) => room.createdAt > now - 3 * 60 * 1000);
    const queues: PublicQueueSummary = {
      GLOBAL: { 5: 0, 11: 0 },
      ACTIVE: { 5: 0, 11: 0 },
      EPL: { 5: 0, 11: 0 },
      TOP_TEAMS: { 5: 0, 11: 0 },
      ICONS: { 5: 0, 11: 0 },
    };

    for (const room of freshRooms) {
      const poolMode = room.settings?.poolMode || 'GLOBAL';
      const matchSize = room.settings?.matchSize;
      if (
        (poolMode === 'GLOBAL' ||
          poolMode === 'ACTIVE' ||
          poolMode === 'EPL' ||
          poolMode === 'TOP_TEAMS' ||
          poolMode === 'ICONS') &&
        (matchSize === 5 || matchSize === 11)
      ) {
        queues[poolMode as PoolMode][matchSize as 5 | 11] += 1;
      }
    }

    return {
      totalWaiting: freshRooms.length,
      queues,
    };
  },
});

export const getUserActiveMatch = query({
  args: { guestId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.guestId) return null;
    const guestId = ctx.db.normalizeId('guestUsers', args.guestId);
    if (!guestId) return null;

    const now = Date.now();
    const maxAgeMs = 45 * 60 * 1000; // 45 minutes limit for active game retention

    // 1. Check Snipe / Auction rooms directly with compound indexes (O(1))
    const candidateRooms = await Promise.all([
      ctx.db
        .query('rooms')
        .withIndex('by_host_status', (q) => q.eq('hostId', guestId).eq('status', 'in_progress'))
        .first(),
      ctx.db
        .query('rooms')
        .withIndex('by_host_status', (q) => q.eq('hostId', guestId).eq('status', 'waiting'))
        .first(),
      ctx.db
        .query('rooms')
        .withIndex('by_host_status', (q) => q.eq('hostId', guestId).eq('status', 'ready'))
        .first(),
      ctx.db
        .query('rooms')
        .withIndex('by_guest_status', (q) => q.eq('guestId', guestId).eq('status', 'in_progress'))
        .first(),
      ctx.db
        .query('rooms')
        .withIndex('by_guest_status', (q) => q.eq('guestId', guestId).eq('status', 'ready'))
        .first(),
    ]);

    const activeRoom = candidateRooms.find((r) => r !== null && r.createdAt > now - maxAgeMs);
    if (activeRoom) {
      const auction = await ctx.db
        .query('auctions')
        .withIndex('by_room', (q) => q.eq('roomId', activeRoom._id))
        .first();

      if (!auction || auction.status !== 'completed') {
        return {
          type: 'snipe' as const,
          id: activeRoom._id,
          code: activeRoom.code,
          status: activeRoom.status,
          matchSize: (activeRoom.settings?.matchSize ?? 11) as 5 | 11,
          poolMode: (activeRoom.settings?.poolMode ?? 'GLOBAL') as PoolMode,
          isHost: activeRoom.hostId === guestId,
          currentRound: auction?.currentRound ?? 1,
          totalRounds: activeRoom.settings?.matchSize ?? 11,
          createdAt: activeRoom.createdAt,
        };
      }
    }

    // 2. Check Rank duel / solo games (indexed by status)
    const [roundActiveGames, roundRevealGames, waitingGames] = await Promise.all([
      ctx.db
        .query('rankGames')
        .withIndex('by_status', (q) => q.eq('status', 'round_active'))
        .take(10),
      ctx.db
        .query('rankGames')
        .withIndex('by_status', (q) => q.eq('status', 'round_reveal'))
        .take(10),
      ctx.db
        .query('rankGames')
        .withIndex('by_status', (q) => q.eq('status', 'waiting'))
        .take(10),
    ]);

    const candidateRankGames = [...roundActiveGames, ...roundRevealGames, ...waitingGames];
    for (const game of candidateRankGames) {
      if (game.createdAt < now - maxAgeMs) continue;
      const isParticipant = game.participants?.some((p) => p.guestId === guestId);
      if (isParticipant) {
        return {
          type: 'rank' as const,
          id: game._id,
          code: game.code,
          status: game.status,
          mode: game.mode,
          roundCount: game.roundCount,
          currentRound: (game.currentRoundIndex ?? 0) + 1,
          isHost: game.participants[0]?.guestId === guestId,
          createdAt: game.createdAt,
        };
      }
    }

    return null;
  },
});


