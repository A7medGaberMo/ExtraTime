import { mutation, internalMutation } from '../_generated/server';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { v } from 'convex/values';
import { GenericMutationCtx } from 'convex/server';
import { generateDraftRounds } from '../auctions/draftEngine';
import { getRandomFormation, MatchSize } from '../auctions/formations';
import { type PoolMode } from '../lib/constants';
import { verifyGuestSession } from '../lib/auth';
import { getCurrentUser } from '../lib/identity';
import { generateUniqueRoomCode, randomPerk, generateRoomSeed } from '../lib/codeGen';

// ── Helpers ────────────────────────────────────────────────

interface CreateRoomArgs {
  hostId: Id<'guestUsers'>;
  hostUserId?: Id<'users'>;
  matchSize: MatchSize;
  startingBudget: number;
  isPublic: boolean;
  poolMode: PoolMode;
}

async function createWaitingRoom(ctx: GenericMutationCtx<DataModel>, args: CreateRoomArgs) {
  const formation = getRandomFormation(args.matchSize);
  const rounds = await generateDraftRounds(ctx, formation, args.matchSize, args.poolMode);
  const hostPerk = randomPerk();
  const code = await generateUniqueRoomCode(ctx);
  const now = Date.now();
  const seed = generateRoomSeed();

  const roomId = await ctx.db.insert('rooms', {
    code,
    hostId: args.hostId,
    hostUserId: args.hostUserId,
    gameType: 'HIDDEN_BID',
    status: 'waiting',
    isPublic: args.isPublic,
    settings: {
      formation,
      matchSize: args.matchSize,
      startingBudget: args.startingBudget,
      poolMode: args.poolMode,
    },
    createdAt: now,
  });

  await ctx.db.insert('auctions', {
    roomId,
    formation,
    matchSize: args.matchSize,
    startingBudget: args.startingBudget,
    poolMode: args.poolMode,
    rounds,
    currentRound: 1,
    status: 'pending',
    seed,
    sealedBids: {},
    bidDeadline: now + 30000,
    roundHistory: [],
    currentBidding: {
      highestBid: 0,
      highestBidderId: undefined,
      activeTurnUserId: args.hostId,
      turnExpiresAt: now + 30000,
      firstPassUserId: undefined,
    },
    host: {
      userId: args.hostId,
      budget: args.startingBudget,
      perk: hostPerk,
      perkUsed: false,
      squad: [],
    },
    createdAt: now,
  });

  return { roomId, code, matched: false };
}

// ── Join Logic (shared between join + findOrCreate) ────────

async function joinAuction(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<'rooms'>,
  guestId: Id<'guestUsers'>,
  auction: Doc<'auctions'>,
  guestUserId?: Id<'users'>,
) {
  const room = await ctx.db.get(roomId);
  if (!room || room.guestId || room.status !== 'waiting') {
    throw new Error('Room is no longer available');
  }

  const guestPerk = randomPerk();
  const activeTurnUserId = auction.host.userId;
  const now = Date.now();

  await ctx.db.patch(roomId, {
    guestId: guestId,
    guestUserId: guestUserId || room.guestUserId,
    status: 'in_progress',
  });

  await ctx.db.patch(auction._id, {
    status: 'active',
    // NOTE: host perk is NOT overwritten — kept as-is from creation
    guest: {
      userId: guestId,
      budget: auction.startingBudget,
      perk: guestPerk,
      perkUsed: false,
      squad: [],
    },
    sealedBids: {},
    bidDeadline: now + 30000,
    roundHistory: [],
    currentBidding: {
      highestBid: 0,
      highestBidderId: undefined,
      activeTurnUserId,
      turnExpiresAt: now + 30000,
      firstPassUserId: undefined,
    },
  });

  return activeTurnUserId;
}

// ── Mutations ──────────────────────────────────────────────

export const create = mutation({
  args: {
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    startingBudget: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);
    const currentUser = await getCurrentUser(ctx);
    const matchSize: MatchSize = args.matchSize ?? 11;
    const startingBudget = args.startingBudget ?? 100;
    const poolMode = (args.poolMode ?? 'GLOBAL') as PoolMode;
    return await createWaitingRoom(ctx, {
      hostId: args.hostId,
      hostUserId: currentUser?._id,
      matchSize,
      startingBudget,
      isPublic: args.isPublic ?? false,
      poolMode,
    });
  },
});

export const join = mutation({
  args: {
    roomId: v.id('rooms'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const currentUser = await getCurrentUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error('Guest not found');

    const auction = await ctx.db
      .query('auctions')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();

    // Allow seamless rejoin for existing host or guest
    if (room.hostId === args.guestId || room.guestId === args.guestId) {
      return {
        roomId: args.roomId,
        activeTurnUserId: auction?.currentBidding.activeTurnUserId ?? room.hostId,
      };
    }

    if (room.guestId) throw new Error('Room is full');
    if (room.status !== 'waiting') throw new Error('Room is not open');
    if (!auction) throw new Error('Auction not found for room');

    const activeTurnUserId = await joinAuction(ctx, args.roomId, args.guestId, auction, currentUser?._id);
    return { roomId: args.roomId, activeTurnUserId };

  },
});

export const findOrCreatePublicMatch = mutation({
  args: {
    userId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.userId, args.sessionToken);
    const currentUser = await getCurrentUser(ctx);
    const matchSize: MatchSize = args.matchSize ?? 11;
    const poolMode = (args.poolMode ?? 'GLOBAL') as PoolMode;
    const now = Date.now();

    const openRooms = await ctx.db
      .query('rooms')
      .withIndex('by_public_status', (q) => q.eq('isPublic', true).eq('status', 'waiting'))
      .collect();

    // Check if player already has an open waiting room (prevents spam and room landfills)
    const existingHostRoom = openRooms.find(
      (r) =>
        r.hostId === args.userId &&
        r.settings.matchSize === matchSize &&
        r.settings.poolMode === poolMode,
    );
    if (existingHostRoom) {
      return { roomId: existingHostRoom._id, code: existingHostRoom.code, matched: false };
    }

    for (const room of openRooms) {
      if (room.createdAt <= now - 5 * 60 * 1000) {
        // Auto-expire stale waiting room after 5 minutes with no rival
        await ctx.db.patch(room._id, { status: 'abandoned' });
        continue;
      }

      const isHost = room.hostId === args.userId;
      const isRecent = room.createdAt > now - 5 * 60 * 1000;
      const matchesSize = room.settings.matchSize === matchSize;
      const matchesPool = room.settings.poolMode === poolMode;

      if (!isHost && isRecent && matchesSize && matchesPool && !room.guestId) {
        const auction = await ctx.db
          .query('auctions')
          .withIndex('by_room', (q) => q.eq('roomId', room._id))
          .first();

        if (auction && auction.status === 'pending') {
          const activeTurnUserId = await joinAuction(ctx, room._id, args.userId, auction, currentUser?._id);
          return { roomId: room._id, code: room.code, matched: true, activeTurnUserId };
        }
      }
    }

    // No compatible room found — create a new one
    return await createWaitingRoom(ctx, {
      hostId: args.userId,
      hostUserId: currentUser?._id,
      matchSize,
      startingBudget: 100,
      isPublic: true,
      poolMode,
    });
  },
});

export const cancel = mutation({
  args: {
    roomId: v.id('rooms'),
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== args.hostId) throw new Error('Only room host can cancel');

    await ctx.db.patch(args.roomId, { status: 'abandoned' });

    const auction = await ctx.db
      .query('auctions')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();

    if (auction) {
      await ctx.db.patch(auction._id, { status: 'completed' });
    }

    return { success: true };
  },
});

export const abandonUserActiveMatch = mutation({
  args: {
    guestId: v.string(),
    sessionToken: v.optional(v.string()),
    matchType: v.union(v.literal('snipe'), v.literal('rank')),
    matchId: v.string(),
  },
  handler: async (ctx, args) => {
    const guestId = ctx.db.normalizeId('guestUsers', args.guestId);
    if (!guestId) return { success: false, reason: 'Invalid guest user ID' };
    await verifyGuestSession(ctx, guestId, args.sessionToken);

    const now = Date.now();


    if (args.matchType === 'snipe') {
      const roomId = ctx.db.normalizeId('rooms', args.matchId);
      if (!roomId) return { success: false, reason: 'Invalid room ID' };
      const room = await ctx.db.get(roomId);
      if (!room) return { success: false, reason: 'Room not found' };

      const isHost = room.hostId === guestId;
      const isGuest = room.guestId === guestId;
      if (!isHost && !isGuest) {
        throw new Error('Not authorized to abandon this match');
      }

      await ctx.db.patch(room._id, { status: 'abandoned' });

      const auction = await ctx.db
        .query('auctions')
        .withIndex('by_room', (q) => q.eq('roomId', room._id))
        .first();

      if (auction) {
        await ctx.db.patch(auction._id, { status: 'completed' });
      }

      return { success: true };
    }

    if (args.matchType === 'rank') {
      const gameId = ctx.db.normalizeId('rankGames', args.matchId);
      if (!gameId) return { success: false, reason: 'Invalid game ID' };
      const game = await ctx.db.get(gameId);
      if (!game) return { success: false, reason: 'Game not found' };

      const isParticipant = game.participants.some((p) => p.guestId === guestId);
      if (!isParticipant) {
        throw new Error('Not authorized to abandon this game');
      }

      if (game.status === 'waiting' || game.mode === 'solo') {
        await ctx.db.patch(game._id, {
          status: 'abandoned',
          completedAt: now,
        });
      } else {
        const remaining = game.participants.find((p) => p.guestId !== guestId);
        await ctx.db.patch(game._id, {
          status: 'abandoned',
          winnerId: remaining?.guestId,
          completedAt: now,
        });
      }

      return { success: true };
    }


    return { success: false };
  },
});

export const cleanupStalePublicQueues = internalMutation({
  args: {},

  handler: async (ctx) => {
    const now = Date.now();
    const staleThreshold = now - 3 * 60 * 1000;

    // 1. Clean stale waiting snipe rooms
    const staleRooms = await ctx.db
      .query('rooms')
      .withIndex('by_public_status', (q) => q.eq('isPublic', true).eq('status', 'waiting'))
      .collect();

    let cleanedRooms = 0;
    for (const room of staleRooms) {
      if (room.createdAt <= staleThreshold) {
        await ctx.db.patch(room._id, { status: 'abandoned' });
        cleanedRooms++;
      }
    }

    // 2. Clean stale waiting rank games
    const staleRankGames = await ctx.db
      .query('rankGames')
      .withIndex('by_public_status', (q) =>
        q.eq('isPublic', true).eq('status', 'waiting').eq('mode', 'duel_public'),
      )
      .collect();

    let cleanedRank = 0;
    for (const game of staleRankGames) {
      if (game.createdAt <= staleThreshold) {
        await ctx.db.patch(game._id, { status: 'abandoned' });
        cleanedRank++;
      }
    }

    return { cleanedRooms, cleanedRank };
  },
});
