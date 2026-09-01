import { mutation } from '../_generated/server';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { v } from 'convex/values';
import { GenericMutationCtx } from 'convex/server';
import { hashSeed, mulberry32 } from '../../src/core/simulation/match-simulator';
import { isAuctionParticipant } from './sealedView';
import { verifyGuestSession } from '../lib/auth';

// ── Helpers ──────────────────────────────────────────────────────


async function getActiveAuction(ctx: GenericMutationCtx<DataModel>, roomId: Id<'rooms'>) {
  const auction = await ctx.db
    .query('auctions')
    .withIndex('by_room', (q) => q.eq('roomId', roomId))
    .first();
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'active') throw new Error('Auction is not active');
  if (!auction.guest) throw new Error('Waiting for opponent');
  return auction;
}

/** Sealed round starter alternates: odd rounds → host starts, even → guest. */
function starterIsHost(roundNumber: number): boolean {
  return roundNumber % 2 !== 0;
}

interface SealedResolution {
  roundNumber: number;
  position: string;
  hostBid: number;
  guestBid: number;
  winnerUserId: Id<'guestUsers'> | undefined;
  winningPrice: number;
  wasTieLottery: boolean;
  completed: boolean;
}

/**
 * Atomic sealed-round resolution.
 * Rules (server-authoritative):
 *  - Higher sealed bid wins the Main Star Card @ that bid; loser receives the
 *    secret Sub-Card at $0M.
 *  - Equal sealed bids (> $0M): deterministic lot draw seeded from the room
 *    seed. Both players pay their committed bid amount for their assigned card
 *    (winner gets Main, loser gets Sub).
 *  - Both pass ($0M): the round starter gets Main @ $0M, non-starter Sub @ $0M.
 * Idempotent: never resolves the same round twice.
 */
async function resolveSealedRoundCore(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<'rooms'>,
  auction: Doc<'auctions'>,
): Promise<SealedResolution> {
  const round = auction.rounds[auction.currentRound - 1];
  const history = [...(auction.roundHistory ?? [])];
  const alreadyResolved = history.find((h) => h.roundNumber === auction.currentRound);
  if (alreadyResolved) {
    return {
      roundNumber: alreadyResolved.roundNumber,
      position: alreadyResolved.position,
      hostBid: alreadyResolved.hostBid,
      guestBid: alreadyResolved.guestBid,
      winnerUserId: alreadyResolved.winnerUserId,
      winningPrice: alreadyResolved.winningPrice,
      wasTieLottery: alreadyResolved.wasTieLottery ?? false,
      completed: auction.currentRound >= auction.rounds.length,
    };
  }

  const hostBid = auction.sealedBids?.host?.amount ?? 0;
  const guestBid = auction.sealedBids?.guest?.amount ?? 0;

  const host = { ...auction.host, squad: [...auction.host.squad] };
  const guest = { ...auction.guest!, squad: [...auction.guest!.squad] };

  let winnerUserId: Id<'guestUsers'> | undefined;
  let winningPrice = 0;
  let wasTieLottery = false;

  if (hostBid === 0 && guestBid === 0) {
    // Both pass — the round starter claims Main @ $0M.
    winnerUserId = starterIsHost(auction.currentRound) ? host.userId : guest.userId;
  } else if (hostBid > guestBid) {
    winnerUserId = host.userId;
    winningPrice = hostBid;
  } else if (guestBid > hostBid) {
    winnerUserId = guest.userId;
    winningPrice = guestBid;
  } else {
    // Equal sealed bids (> $0M) — deterministic lot draw via room seed.
    const lotRng = mulberry32(
      hashSeed(`${auction.seed ?? roomId}:${auction.currentRound}:lottery`),
    );
    winnerUserId = lotRng() < 0.5 ? host.userId : guest.userId;
    winningPrice = hostBid;
    wasTieLottery = true;
  }

  if (winnerUserId === host.userId) {
    host.budget -= winningPrice;
    host.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: round.mainPlayerId,
      isSub: false,
      cost: winningPrice,
    });

    const guestCost = guestBid;
    guest.budget -= guestCost;
    guest.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: round.subPlayerId,
      isSub: true,
      cost: guestCost,
    });
  } else {
    guest.budget -= winningPrice;
    guest.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: round.mainPlayerId,
      isSub: false,
      cost: winningPrice,
    });

    const hostCost = hostBid;
    host.budget -= hostCost;
    host.squad.push({
      roundNumber: auction.currentRound,
      position: round.position,
      playerId: round.subPlayerId,
      isSub: true,
      cost: hostCost,
    });
  }

  history.push({
    roundNumber: auction.currentRound,
    position: round.position,
    hostBid,
    guestBid,
    winnerUserId,
    winningPrice,
    wasTieLottery: wasTieLottery || undefined,
  });

  const completed = auction.currentRound >= auction.rounds.length;
  const nextRoundNum = auction.currentRound + 1;

  await ctx.db.patch(auction._id, {
    status: completed ? 'completed' : 'active',
    currentRound: completed ? auction.currentRound : nextRoundNum,
    host,
    guest,
    sealedBids: {},
    bidDeadline: completed ? undefined : Date.now() + 30000,
    roundHistory: history,
    currentBidding: {
      highestBid: 0,
      highestBidderId: undefined,
      activeTurnUserId: completed
        ? undefined
        : starterIsHost(nextRoundNum)
          ? host.userId
          : guest.userId,
      turnExpiresAt: Date.now() + 30000,
      firstPassUserId: undefined,
    },
  });

  if (completed) {
    await ctx.db.patch(roomId, { status: 'completed' });
    // Auto-create the pending match so the Universal Score Hub can latch on.
    const existing = await ctx.db
      .query('matches')
      .withIndex('by_room', (q) => q.eq('roomId', roomId))
      .first();
    if (!existing) {
      await ctx.db.insert('matches', {
        roomId,
        hostSquad: host.squad.map((s) => s.playerId),
        guestSquad: guest.squad.map((s) => s.playerId),
        score: { host: 0, guest: 0 },
        status: 'pending',
        seed: auction.seed,
        gameType: 'hidden_bid',
      });
    }
  }

  return {
    roundNumber: auction.currentRound,
    position: round.position,
    hostBid,
    guestBid,
    winnerUserId,
    winningPrice,
    wasTieLottery,
    completed,
  };
}

// ── Mutations ────────────────────────────────────────────────────

/**
 * ✉️ Locks a secret sealed bid into the round lockbox.
 * The bid is invisible to the opponent until BOTH bids are locked (or the
 * 30s blind phase expires), at which point the server resolves the round.
 */
export const submitSealedBid = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.userId, args.sessionToken);
    const auction = await getActiveAuction(ctx, args.roomId);

    const isHost = auction.host.userId === args.userId;
    const me = isHost ? auction.host : auction.guest;
    if (!me) throw new Error('Player is not in this auction');

    if (!Number.isInteger(args.amount) || args.amount < 0) {
      throw new Error('Bid must be a whole number of $M (0 = pass)');
    }
    if (args.amount > me.budget) {
      throw new Error(`Insufficient budget. You have $${me.budget}M`);
    }

    type SealedBidsShape = {
      host?: { amount: number; submittedAt: number };
      guest?: { amount: number; submittedAt: number };
    };
    const sealedBids: SealedBidsShape = { ...(auction.sealedBids ?? {}) };
    const myKey = isHost ? 'host' : 'guest';
    const mySealed = sealedBids[myKey];
    if (mySealed) throw new Error('Your sealed bid is already locked ✉️');

    // Blind phase guard — the envelope is sealed at the deadline.
    const deadline = auction.bidDeadline ?? 0;
    if (deadline > 0 && Date.now() > deadline + 2000) {
      throw new Error('Blind bid phase has expired');
    }

    sealedBids[myKey] = { amount: args.amount, submittedAt: Date.now() };

    const opponentBid = isHost ? sealedBids.guest : sealedBids.host;
    const bothLocked = Boolean(opponentBid);

    await ctx.db.patch(auction._id, { sealedBids });

    if (bothLocked) {
      const resolution = await resolveSealedRoundCore(ctx, args.roomId, {
        ...auction,
        sealedBids,
      });
      return { resolved: true, ...resolution };
    }

    return { resolved: false, roundNumber: auction.currentRound };
  },
});

/**
 * Resolves the sealed round (deadline expiry path). Safe to call from both
 * clients — the resolver is idempotent per round. Missing bids count as passes.
 *
 * Guards (server-authoritative):
 *  - Caller must be a room participant.
 *  - Resolve only when both envelopes are locked OR the blind deadline has passed.
 *    Early force-resolve (opponent still deciding) is rejected.
 */
export const resolveSealedRound = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.userId, args.sessionToken);
    const auction = await getActiveAuction(ctx, args.roomId);


    if (!isAuctionParticipant(auction, args.userId)) {
      throw new Error('Only auction participants can resolve the round');
    }

    const history = auction.roundHistory ?? [];
    const alreadyResolved = history.some((h) => h.roundNumber === auction.currentRound);
    if (!alreadyResolved) {
      const bothLocked = Boolean(auction.sealedBids?.host && auction.sealedBids?.guest);
      const deadline = auction.bidDeadline ?? 0;
      // Allow a 1.5s tolerance for clock drift between client and server
      const expired = deadline > 0 && Date.now() >= deadline - 1500;
      if (!bothLocked && !expired) {
        return { resolved: false, reason: 'waiting_for_bids' };
      }
    }

    const resolution = await resolveSealedRoundCore(ctx, args.roomId, auction);
    return { resolved: true, ...resolution };
  },
});
