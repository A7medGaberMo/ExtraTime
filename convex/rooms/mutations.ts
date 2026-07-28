import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { generateDraftRounds, PlayerPoolMode } from "../auctions/draftEngine";
import { getRandomFormation, MatchSize } from "../auctions/formations";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function generateUniqueRoomCode(ctx: any) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q: any) => q.eq("code", code))
      .first();
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code");
}

function autoPerks() {
  return Math.random() < 0.5
    ? ({ host: "SCOUT", guest: "SPY" } as const)
    : ({ host: "SPY", guest: "SCOUT" } as const);
}

async function createWaitingRoom(ctx: any, args: {
  hostId: any;
  matchSize: MatchSize;
  startingBudget: number;
  isPublic: boolean;
  poolMode: PlayerPoolMode;
}) {
  const formation = getRandomFormation(args.matchSize);
  const rounds = await generateDraftRounds(ctx, formation, args.matchSize, args.poolMode);
  const perks = autoPerks();
  const code = await generateUniqueRoomCode(ctx);
  const now = Date.now();
  const roomId = await ctx.db.insert("rooms", {
    code,
    hostId: args.hostId,
    gameType: "HIDDEN_BID",
    status: "waiting",
    isPublic: args.isPublic,
    settings: {
      formation,
      matchSize: args.matchSize,
      startingBudget: args.startingBudget,
      poolMode: args.poolMode,
    },
    createdAt: now,
  });

  await ctx.db.insert("auctions", {
    roomId,
    formation,
    matchSize: args.matchSize,
    startingBudget: args.startingBudget,
    poolMode: args.poolMode,
    rounds,
    currentRound: 1,
    status: "pending",
    currentBidding: {
      highestBid: 0,
      highestBidderId: undefined,
      activeTurnUserId: args.hostId,
      turnExpiresAt: now + 15000,
    },
    host: {
      userId: args.hostId,
      budget: args.startingBudget,
      perk: perks.host,
      perkUsed: false,
      squad: [],
    },
    createdAt: now,
  });

  return { roomId, code, matched: false };
}

export const create = mutation({
  args: {
    hostId: v.id("guestUsers"),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    startingBudget: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchSize: MatchSize = args.matchSize || 11;
    const startingBudget = args.startingBudget || 100;
    const poolMode: PlayerPoolMode = args.poolMode as PlayerPoolMode || "GLOBAL";
    return await createWaitingRoom(ctx, {
      hostId: args.hostId,
      matchSize,
      startingBudget,
      isPublic: args.isPublic || false,
      poolMode,
    });
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest not found");
    if (room.guestId) throw new Error("Room is full");
    if (room.status !== "waiting") throw new Error("Room is not open");
    if (room.hostId === args.guestId) throw new Error("You cannot join your own room");

    const auction = await ctx.db
      .query("auctions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!auction) throw new Error("Auction not found for room");

    const perks = autoPerks();
    const activeTurnUserId = Math.random() < 0.5 ? auction.host.userId : args.guestId;
    const now = Date.now();
    await ctx.db.patch(args.roomId, {
      guestId: args.guestId,
      status: "in_progress",
    });
    await ctx.db.patch(auction._id, {
      status: "active",
      host: { ...auction.host, perk: perks.host },
      guest: {
        userId: args.guestId,
        budget: auction.startingBudget,
        perk: perks.guest,
        perkUsed: false,
        squad: [],
      },
      currentBidding: {
        ...auction.currentBidding,
        highestBid: 0,
        highestBidderId: undefined,
        activeTurnUserId,
        turnExpiresAt: now + 15000,
      },
    });
    return { roomId: args.roomId, activeTurnUserId };
  },
});

export const findOrCreatePublicMatch = mutation({
  args: {
    userId: v.id("guestUsers"),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matchSize: MatchSize = args.matchSize || 11;
    const poolMode: PlayerPoolMode = args.poolMode as PlayerPoolMode || "GLOBAL";
    const now = Date.now();
    const openRooms = await ctx.db
      .query("rooms")
      .withIndex("by_public_status", (q) => q.eq("isPublic", true).eq("status", "waiting"))
      .collect();
    let match = null;
    let matchAuction = null;
    for (const room of openRooms) {
      const isCompatible =
        room.hostId !== args.userId &&
        room.createdAt > now - 10 * 60 * 1000 &&
        room.settings?.matchSize === matchSize &&
        (room.settings?.poolMode || "GLOBAL") === poolMode;
      if (!isCompatible) continue;

      const auction = await ctx.db
        .query("auctions")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .first();
      if (auction) {
        match = room;
        matchAuction = auction;
        break;
      }
    }

    if (match && matchAuction) {
      const perks = autoPerks();
      const activeTurnUserId = Math.random() < 0.5 ? matchAuction.host.userId : args.userId;
      await ctx.db.patch(match._id, { guestId: args.userId, status: "in_progress" });
      await ctx.db.patch(matchAuction._id, {
        status: "active",
        host: { ...matchAuction.host, perk: perks.host },
        guest: {
          userId: args.userId,
          budget: matchAuction.startingBudget,
          perk: perks.guest,
          perkUsed: false,
          squad: [],
        },
        currentBidding: {
          ...matchAuction.currentBidding,
          highestBid: 0,
          highestBidderId: undefined,
          activeTurnUserId,
          turnExpiresAt: now + 15000,
        },
      });
      return { roomId: match._id, code: match.code, matched: true };
    }

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
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("waiting"),
      v.literal("ready"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { status: args.status });
  },
});

export const cancel = mutation({
  args: {
    roomId: v.id("rooms"),
    hostId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== args.hostId) throw new Error("Only room host can cancel");

    await ctx.db.patch(args.roomId, { status: "abandoned" });

    const auction = await ctx.db
      .query("auctions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();

    if (auction) {
      await ctx.db.patch(auction._id, { status: "completed" });
    }

    return { success: true };
  },
});
