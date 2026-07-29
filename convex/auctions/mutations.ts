import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { GenericMutationCtx } from "convex/server";

// ── Helpers ────────────────────────────────────────────────
async function getAuction(ctx: GenericMutationCtx<any>, roomId: Id<"rooms">) {
  const auction = await ctx.db
    .query("auctions")
    .withIndex("by_room", (q: any) => q.eq("roomId", roomId))
    .first();
  if (!auction) throw new Error("Auction not found");
  if (auction.status !== "active") throw new Error("Auction is not active");
  return auction;
}

function validateTurnExpiry(expiresAt: number): void {
  // Allow 2s grace period for network latency
  const now = Date.now();
  if (now > expiresAt + 2000) {
    throw new Error("Turn has already expired");
  }
}

async function resolveRound(
  ctx: GenericMutationCtx<any>,
  roomId: Id<"rooms">,
  auction: any,
  winnerId: Id<"guestUsers"> | undefined,
  price: number
) {
  if (!auction.guest) throw new Error("Waiting for opponent");

  const round = auction.rounds[auction.currentRound - 1];
  const host = { ...auction.host, squad: [...auction.host.squad] };
  const guest = { ...auction.guest, squad: [...auction.guest.squad] };

  // Calculate deterministic starter for the NEXT round
  // Odd rounds (1, 3, 5...): Host starts first. 
  // Even rounds (2, 4, 6...): Guest starts first.
  const nextRoundNum = auction.currentRound + 1;
  const nextStarterId = nextRoundNum % 2 !== 0 ? auction.host.userId : auction.guest.userId;

  if (!winnerId) {
    // TIE-BREAK: Both passed with no bid
    // Turn starter gets main player for 0, non-starter gets hidden sub player for 0
    const hostGetsMain = auction.currentRound % 2 !== 0;
    host.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: hostGetsMain ? round.mainPlayerId : round.subPlayerId,
      isSub: !hostGetsMain,
      cost: 0,
    });
    guest.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: hostGetsMain ? round.subPlayerId : round.mainPlayerId,
      isSub: hostGetsMain,
      cost: 0,
    });
  } else if (winnerId === host.userId) {
    host.budget -= price;
    host.squad.push({ roundNumber: auction.currentRound, position: round.position, playerId: round.mainPlayerId, isSub: false, cost: price });
    guest.squad.push({ roundNumber: auction.currentRound, position: round.position, playerId: round.subPlayerId, isSub: true, cost: 0 });
  } else {
    guest.budget -= price;
    guest.squad.push({ roundNumber: auction.currentRound, position: round.position, playerId: round.mainPlayerId, isSub: false, cost: price });
    host.squad.push({ roundNumber: auction.currentRound, position: round.position, playerId: round.subPlayerId, isSub: true, cost: 0 });
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
      activeTurnUserId: completed ? undefined : nextStarterId,
      turnExpiresAt: Date.now() + 30000,
      firstPassUserId: undefined,
    },
  });
  if (completed) await ctx.db.patch(roomId, { status: "completed" });
}

// ── Mutations ──────────────────────────────────────────────

export const placeBid = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const auction = await getAuction(ctx, args.roomId);

    // Validate it's this player's turn
    if (auction.currentBidding.activeTurnUserId !== args.userId) {
      throw new Error("It is not your turn");
    }

    // Server-side turn expiry check
    validateTurnExpiry(auction.currentBidding.turnExpiresAt);

    // Validate bid amount
    if (!Number.isInteger(args.amount) || args.amount <= 0) {
      throw new Error("Bid must be a positive whole number");
    }

    const me = auction.host.userId === args.userId ? auction.host : auction.guest;
    if (!me) throw new Error("Player is not in this auction");
    if (args.amount > me.budget) throw new Error(`Insufficient budget. You have $${me.budget}M`);

    const minimum = auction.currentBidding.highestBid > 0 ? auction.currentBidding.highestBid + 1 : 1;
    if (args.amount < minimum) throw new Error(`Minimum bid is $${minimum}M`);

    const opponent = auction.host.userId === args.userId ? auction.guest : auction.host;
    if (!opponent) throw new Error("Waiting for opponent");

    // FIX: Use strict less-than — opponent should get a chance to match equal bids
    if (opponent.budget < args.amount) {
      await resolveRound(ctx, args.roomId, auction, args.userId, args.amount);
      return { resolved: true, reason: "UNBEATABLE_BID" };
    }

    await ctx.db.patch(auction._id, {
      currentBidding: {
        highestBid: args.amount,
        highestBidderId: args.userId,
        activeTurnUserId: opponent.userId,
        turnExpiresAt: Date.now() + 30000,
        firstPassUserId: undefined,
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
    if (auction.currentBidding.activeTurnUserId !== args.userId) {
      throw new Error("It is not your turn");
    }

    const opponent = auction.host.userId === args.userId ? auction.guest : auction.host;

    if (auction.currentBidding.highestBid === 0) {
      // It's a 0-bid situation
      if (auction.currentBidding.firstPassUserId && auction.currentBidding.firstPassUserId !== args.userId) {
        // This is the second pass in a row! Both players passed with no bid.
        await resolveRound(
          ctx,
          args.roomId,
          auction,
          undefined,
          0
        );
        return { resolved: true };
      } else {
        // This is the first pass! Just flip the turn.
        await ctx.db.patch(auction._id, {
          currentBidding: {
            ...auction.currentBidding,
            activeTurnUserId: opponent.userId,
            firstPassUserId: args.userId,
            turnExpiresAt: Date.now() + 30000, // Reset timer for opponent
          }
        });
        return { resolved: false };
      }
    } else {
      // Someone has already bid, and now the active player passes. Round resolves.
      await resolveRound(
        ctx,
        args.roomId,
        auction,
        auction.currentBidding.highestBidderId,
        auction.currentBidding.highestBid
      );
      return { resolved: true };
    }
  },
});

export const usePerk = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const auction = await getAuction(ctx, args.roomId);

    const isHost = auction.host.userId === args.userId;
    const me = isHost ? auction.host : auction.guest;
    if (!me) throw new Error("Player is not in this auction");

    // ── Once-per-game guard ──
    if (me.perkUsed) {
      throw new Error("You have already used your perk this game");
    }

    const opponent = isHost ? auction.guest : auction.host;
    if (!opponent) throw new Error("Waiting for opponent");

    // Mark perk as used & add +10s time boost to current turn timer!
    const updatedMe = { ...me, perkUsed: true, perkUsedRound: auction.currentRound };
    const boostedExpiresAt = Math.max(Date.now(), auction.currentBidding.turnExpiresAt || Date.now()) + 10000;

    if (isHost) {
      await ctx.db.patch(auction._id, {
        host: updatedMe,
        currentBidding: {
          ...auction.currentBidding,
          turnExpiresAt: boostedExpiresAt,
        },
      });
    } else {
      await ctx.db.patch(auction._id, {
        guest: updatedMe,
        currentBidding: {
          ...auction.currentBidding,
          turnExpiresAt: boostedExpiresAt,
        },
      });
    }

    // Return perk effect data based on perk type
    const round = auction.rounds[auction.currentRound - 1];
    const nextRound = auction.rounds[auction.currentRound] ?? null;

    if (me.perk === "SCOUT") {
      // SCOUT: Scouts ahead — reveals opponent's budget + next round's main player
      const nextMain: any = nextRound ? await ctx.db.get(nextRound.mainPlayerId) : null;
      return {
        perk: "SCOUT" as const,
        opponentBudget: opponent.budget,
        nextPosition: nextRound?.position ?? null,
        nextMainName: nextMain?.name ?? null,
      };
    }

    if (me.perk === "SPY") {
      // SPY: Spies on hidden info — reveals the backup sub player for this round
      const subPlayer: any = await ctx.db.get(round.subPlayerId);
      const subClub: any = subPlayer ? await ctx.db.get(subPlayer.clubId) : null;
      const subNation: any = subPlayer ? await ctx.db.get(subPlayer.nationId) : null;
      return {
        perk: "SPY" as const,
        revealedSub: subPlayer
          ? {
              name: subPlayer.name,
              position: subPlayer.position,
              tier: subPlayer.tier,
              club: subClub?.name ?? "Unknown",
              nation: subNation?.name ?? "Unknown",
              kitNumber: subPlayer.kitNumber,
            }
          : null,
      };
    }

    if (me.perk === "FREEZE" || me.perk === "SHIELD") {
      return {
        perk: me.perk,
        active: true,
      };
    }

    throw new Error("Unknown perk type");
  },
});

export const activatePerk = usePerk;


