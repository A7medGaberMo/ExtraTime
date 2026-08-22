import { mutation } from '../_generated/server';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { v } from 'convex/values';
import { GenericMutationCtx } from 'convex/server';
import { generateDraftRounds } from '../auctions/draftEngine';
import { getRandomFormation, MatchSize } from '../auctions/formations';
import { type PoolMode } from '../lib/constants';

// ── Helpers ────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function generateUniqueRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const existing = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique room code');
}

function randomPerk(): 'SCOUT' | 'SPY' {
  return Math.random() < 0.5 ? 'SCOUT' : 'SPY';
}

/** Deterministic room seed — drives tie lotteries + the match simulation. */
function generateRoomSeed(): string {
  const rand =
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2);
  return rand.slice(0, 16);
}

interface CreateRoomArgs {
  hostId: Id<'guestUsers'>;
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
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    startingBudget: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchSize: MatchSize = args.matchSize ?? 11;
    const startingBudget = args.startingBudget ?? 100;
    const poolMode = (args.poolMode ?? 'GLOBAL') as PoolMode;
    return await createWaitingRoom(ctx, {
      hostId: args.hostId,
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
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error('Room not found');
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error('Guest not found');
    if (room.guestId) throw new Error('Room is full');
    if (room.status !== 'waiting') throw new Error('Room is not open');
    if (room.hostId === args.guestId) throw new Error('You cannot join your own room');

    const auction = await ctx.db
      .query('auctions')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();
    if (!auction) throw new Error('Auction not found for room');

    const activeTurnUserId = await joinAuction(ctx, args.roomId, args.guestId, auction);
    return { roomId: args.roomId, activeTurnUserId };
  },
});

export const findOrCreatePublicMatch = mutation({
  args: {
    userId: v.id('guestUsers'),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchSize: MatchSize = args.matchSize ?? 11;
    const poolMode = (args.poolMode ?? 'GLOBAL') as PoolMode;
    const now = Date.now();

    const openRooms = await ctx.db
      .query('rooms')
      .withIndex('by_public_status', (q) => q.eq('isPublic', true).eq('status', 'waiting'))
      .collect();

    // Find a compatible room and clean up stale ones
    for (const room of openRooms) {
      if (room.createdAt <= now - 3 * 60 * 1000) {
        // Auto-expire stale waiting room after 3 minutes with no rival
        await ctx.db.patch(room._id, { status: 'abandoned' });
        continue;
      }

      const isCompatible =
        room.hostId !== args.userId &&
        room.createdAt > now - 3 * 60 * 1000 &&
        room.settings?.matchSize === matchSize &&
        (room.settings?.poolMode ?? 'GLOBAL') === poolMode;

      if (!isCompatible) continue;

      const auction = await ctx.db
        .query('auctions')
        .withIndex('by_room', (q) => q.eq('roomId', room._id))
        .first();

      if (auction) {
        await joinAuction(ctx, room._id, args.userId, auction);
        return { roomId: room._id, code: room.code, matched: true };
      }
    }

    // No compatible room found — create a new one
    return await createWaitingRoom(ctx, {
      hostId: args.userId,
      matchSize,
      startingBudget: 100,
      isPublic: true,
      poolMode,
    });
  },
});

export const updateStatus = mutation({
  args: {
    roomId: v.id('rooms'),
    status: v.union(
      v.literal('waiting'),
      v.literal('ready'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('abandoned'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { status: args.status });
  },
});

export const cancel = mutation({
  args: {
    roomId: v.id('rooms'),
    hostId: v.id('guestUsers'),
  },
  handler: async (ctx, args) => {
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
