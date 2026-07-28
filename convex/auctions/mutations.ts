import { mutation } from "../_generated/server";
import { v } from "convex/values";

async function getAuction(ctx: any, roomId: any) {
  const auction = await ctx.db
    .query("auctions")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .first();
  if (!auction) throw new Error("Auction not found");
  if (auction.status !== "active") throw new Error("Auction is not active");
  return auction;
}

async function resolveRound(ctx: any, roomId: any, auction: any, winnerId: any, price: number, nextStarterId: any) {
  if (!auction.guest) throw new Error("Waiting for opponent");

  const round = auction.rounds[auction.currentRound - 1];
  const host = { ...auction.host, squad: [...auction.host.squad] };
  const guest = { ...auction.guest, squad: [...auction.guest.squad] };

  if (!winnerId) {
    const hostGetsSub = nextStarterId === guest.userId;
    host.squad.push({
      position: round.position,
      playerId: hostGetsSub ? round.subPlayerId : round.mainPlayerId,
      isSub: hostGetsSub,
      cost: 0,
    });
    guest.squad.push({
      position: round.position,
      playerId: hostGetsSub ? round.mainPlayerId : round.subPlayerId,
      isSub: !hostGetsSub,
      cost: 0,
    });
  } else if (winnerId === host.userId) {
    host.budget -= price;
    host.squad.push({ position: round.position, playerId: round.mainPlayerId, isSub: false, cost: price });
    guest.squad.push({ position: round.position, playerId: round.subPlayerId, isSub: true, cost: 0 });
  } else {
    guest.budget -= price;
    guest.squad.push({ position: round.position, playerId: round.mainPlayerId, isSub: false, cost: price });
    host.squad.push({ position: round.position, playerId: round.subPlayerId, isSub: true, cost: 0 });
  }

  const completed = auction.currentRound >= auction.rounds.length;
  await ctx.db.patch(auction._id, {
    status: completed ? "completed" : "active",
    currentRound: completed ? auction.currentRound : auction.currentRound + 1,
    host,
    guest,
    currentBidding: {
      highestBid: 0,
      highestBidderId: undefined,
      activeTurnUserId: nextStarterId,
      turnExpiresAt: Date.now() + 15000,
    },
  });
  if (completed) await ctx.db.patch(roomId, { status: "completed" });
}

export const placeBid = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const auction = await getAuction(ctx, args.roomId);
    if (auction.currentBidding.activeTurnUserId !== args.userId) throw new Error("It is not your turn");
    if (!Number.isInteger(args.amount) || args.amount <= 0) throw new Error("Bid must be a positive whole number");
    const player = auction.host.userId === args.userId ? auction.host : auction.guest;
    if (!player) throw new Error("Player is not in this auction");
    if (args.amount > player.budget) throw new Error(`Insufficient budget. You have $${player.budget}M`);
    const minimum = auction.currentBidding.highestBid > 0 ? auction.currentBidding.highestBid + 1 : 1;
    if (args.amount < minimum) throw new Error(`Minimum bid is $${minimum}M`);
    const opponent = auction.host.userId === args.userId ? auction.guest : auction.host;
    if (!opponent) throw new Error("Waiting for opponent");

    if (opponent.budget <= args.amount) {
      await resolveRound(ctx, args.roomId, auction, args.userId, args.amount, opponent.userId);
      return { resolved: true, reason: "UNBEATABLE_BID" };
    }

    await ctx.db.patch(auction._id, {
      currentBidding: {
        highestBid: args.amount,
        highestBidderId: args.userId,
        activeTurnUserId: opponent.userId,
        turnExpiresAt: Date.now() + 15000,
      },
    });
    return { resolved: false };
  },
});

export const pass = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const auction = await getAuction(ctx, args.roomId);
    if (!auction.guest) throw new Error("Waiting for opponent");
    if (auction.currentBidding.activeTurnUserId !== args.userId) throw new Error("It is not your turn");
    const nextStarterId = args.userId === auction.host.userId ? auction.guest.userId : auction.host.userId;
    await resolveRound(
      ctx,
      args.roomId,
      auction,
      auction.currentBidding.highestBidderId,
      auction.currentBidding.highestBid,
      nextStarterId
    );
    return { resolved: true };
  },
});
