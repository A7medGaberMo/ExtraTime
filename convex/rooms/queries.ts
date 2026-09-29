import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { v } from 'convex/values';

type PoolMode = 'GLOBAL' | 'ACTIVE' | 'EPL' | 'EGYPT' | 'ICONS';
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
      EGYPT: { 5: 0, 11: 0 },
      ICONS: { 5: 0, 11: 0 },
    };

    for (const room of freshRooms) {
      const poolMode = room.settings?.poolMode || 'GLOBAL';
      const matchSize = room.settings?.matchSize;
      if (
        (poolMode === 'GLOBAL' ||
          poolMode === 'ACTIVE' ||
          poolMode === 'EPL' ||
          poolMode === 'EGYPT' ||
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

    // 3. Check Draft duel / solo games
    const [draftWaiting, draftFormation, draftDrafting, draftSwapping] = await Promise.all([
      ctx.db
        .query('draftGames')
        .withIndex('by_status', (q) => q.eq('status', 'waiting'))
        .take(10),
      ctx.db
        .query('draftGames')
        .withIndex('by_status', (q) => q.eq('status', 'formation'))
        .take(10),
      ctx.db
        .query('draftGames')
        .withIndex('by_status', (q) => q.eq('status', 'drafting'))
        .take(10),
      ctx.db
        .query('draftGames')
        .withIndex('by_status', (q) => q.eq('status', 'swapping'))
        .take(10),
    ]);

    const candidateDraftGames = [
      ...draftWaiting,
      ...draftFormation,
      ...draftDrafting,
      ...draftSwapping,
    ];
    for (const game of candidateDraftGames) {
      if (game.createdAt < now - maxAgeMs) continue;
      const isParticipant = game.participants?.some((p) => p.guestId === guestId);
      if (isParticipant) {
        const p = game.participants.find((p) => p.guestId === guestId);
        return {
          type: 'draft' as const,
          id: game._id,
          code: game.code,
          status: game.status,
          mode: game.mode,
          currentSlotIndex: p?.currentSlotIndex ?? 0,
          totalPicks: 14,
          isHost: game.participants[0]?.guestId === guestId,
          createdAt: game.createdAt,
        };
      }
    }

    // 4. Check Bank duel / solo games using indexed player lookups
    const [bankAsP1, bankAsP2] = await Promise.all([
      ctx.db
        .query('bankGames')
        .withIndex('by_player1', (q) => q.eq('player1Id', guestId))
        .order('desc')
        .take(5),
      ctx.db
        .query('bankGames')
        .withIndex('by_player2', (q) => q.eq('player2Id', guestId))
        .order('desc')
        .take(5),
    ]);

    const activeStatuses = new Set(['waiting', 'in_progress', 'round_break', 'sudden_death']);
    const candidateBankGames = [...bankAsP1, ...bankAsP2].filter(
      (g) => activeStatuses.has(g.status) && g.createdAt >= now - maxAgeMs
    );

    for (const game of candidateBankGames) {
      const isParticipant = game.participants?.some((p) => p.guestId === guestId);
      if (isParticipant) {
        return {
          type: 'bank' as const,
          id: game._id,
          code: game.code,
          status: game.status,
          mode: game.mode,
          currentRound: game.currentRound,
          isHost: game.participants[0]?.guestId === guestId,
          createdAt: game.createdAt,
        };
      }
    }

    return null;
  },
});

/**
 * Reactive rematch invite state for the result page.
 * Both players subscribe; returns null if no rematch has been requested.
 */
export const getRematchState = query({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('guestUsers'),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const rematchRoomId = (room as Record<string, unknown>).rematchRoomId;
    if (!rematchRoomId) return { status: 'none' as const };

    const rematchRoom = await ctx.db.get(rematchRoomId as Id<'rooms'>);
    if (!rematchRoom) return { status: 'none' as const };

    const inviterId = (rematchRoom as Record<string, unknown>).rematchInviterId as
      | Id<'guestUsers'>
      | undefined;
    const iAmInviter = inviterId === args.userId;

    // Fetch inviter's nickname for the UI
    const inviterUser = inviterId ? await ctx.db.get(inviterId) : null;
    const inviterName = inviterUser?.nickname ?? 'Opponent';

    if (rematchRoom.status === 'waiting') {
      return {
        status: 'pending' as const,
        rematchRoomId: rematchRoom._id,
        iAmInviter,
        inviterName,
      };
    }

    if (rematchRoom.status === 'in_progress' || rematchRoom.status === 'ready') {
      return {
        status: 'accepted' as const,
        rematchRoomId: rematchRoom._id,
        iAmInviter,
        inviterName,
      };
    }

    if (rematchRoom.status === 'abandoned') {
      return {
        status: 'declined' as const,
        rematchRoomId: rematchRoom._id,
        iAmInviter,
        inviterName,
      };
    }

    // completed or unknown
    return { status: 'none' as const };
  },
});
