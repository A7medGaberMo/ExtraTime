import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Sealed bid lockbox — parallel secret-bid resolution for the Hidden Bid mode.
 * Both managers submit without seeing the other's number; the server resolves
 * them atomically when both are locked OR the round deadline expires.
 */
export const sealedBidValidator = v.object({
  amount: v.number(), // 0 = pass
  submittedAt: v.number(),
});

export const roundHistoryEntryValidator = v.object({
  roundNumber: v.number(),
  position: v.string(),
  hostBid: v.number(),
  guestBid: v.number(),
  winnerUserId: v.optional(v.id("guestUsers")),
  winningPrice: v.number(),
  wasTieLottery: v.optional(v.boolean()),
});

export const auctionsTable = defineTable({
  roomId: v.id("rooms"),
  formation: v.string(),
  matchSize: v.union(v.literal(5), v.literal(11)),
  startingBudget: v.number(),
  poolMode: v.string(),
  rounds: v.array(
    v.object({
      roundNumber: v.number(),
      position: v.string(),
      mainPlayerId: v.id("players"),
      subPlayerId: v.id("players"),
      isMysteryRound: v.optional(v.boolean()),
    })
  ),
  currentRound: v.number(),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("completed")
  ),
  currentBidding: v.object({
    highestBid: v.number(),
    highestBidderId: v.optional(v.id("guestUsers")),
    activeTurnUserId: v.optional(v.id("guestUsers")),
    turnExpiresAt: v.number(),
    firstPassUserId: v.optional(v.id("guestUsers")),
  }),
  host: v.object({
    userId: v.id("guestUsers"),
    budget: v.number(),
    perk: v.union(v.literal("SCOUT"), v.literal("SPY")),
    perkUsed: v.boolean(),
    perkUsedRound: v.optional(v.number()),
    squad: v.array(
      v.object({
        roundNumber: v.optional(v.number()),
        position: v.string(),
        playerId: v.id("players"),
        isSub: v.boolean(),
        cost: v.number(),
      })
    ),
  }),
  guest: v.optional(
    v.object({
      userId: v.id("guestUsers"),
      budget: v.number(),
      perk: v.union(v.literal("SCOUT"), v.literal("SPY")),
      perkUsed: v.boolean(),
      perkUsedRound: v.optional(v.number()),
      squad: v.array(
        v.object({
          roundNumber: v.optional(v.number()),
          position: v.string(),
          playerId: v.id("players"),
          isSub: v.boolean(),
          cost: v.number(),
        })
      ),
    })
  ),
  // ── Sealed blind-bid state (Hidden Bid revamp) ──
  seed: v.optional(v.string()),
  sealedBids: v.optional(
    v.object({
      host: v.optional(sealedBidValidator),
      guest: v.optional(sealedBidValidator),
    })
  ),
  /** Timestamp by which both sealed bids must be in (30s blind phase). */
  bidDeadline: v.optional(v.number()),
  /** Permanent per-round resolution record for reveal overlays. */
  roundHistory: v.optional(v.array(roundHistoryEntryValidator)),
  createdAt: v.number(),
}).index("by_room", ["roomId"]);