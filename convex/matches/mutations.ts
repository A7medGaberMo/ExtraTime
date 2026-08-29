import { mutation } from '../_generated/server';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { v } from 'convex/values';
import { GenericMutationCtx } from 'convex/server';
import { simulateTacticalMatch, SimPlayer } from '../../src/core/simulation/match-simulator';
import { isAuctionParticipant } from '../auctions/sealedView';
import { scoreLeagueSnipeMatch } from '../leagues/scoring';
import { verifyGuestSession } from '../lib/auth';

// ── Helpers ──────────────────────────────────────────────────────

interface AuctionWithGuest extends Doc<'auctions'> {
  guest: NonNullable<Doc<'auctions'>['guest']>;
}

async function getCompletedAuction(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<'rooms'>,
): Promise<AuctionWithGuest> {
  const auction = await ctx.db
    .query('auctions')
    .withIndex('by_room', (q) => q.eq('roomId', roomId))
    .first();
  if (!auction) throw new Error('Auction not found');
  if (auction.status !== 'completed') throw new Error('Auction not yet completed');
  if (!auction.guest) throw new Error('Waiting for opponent');
  return auction as AuctionWithGuest;
}

async function ensureMatch(
  ctx: GenericMutationCtx<DataModel>,
  auction: AuctionWithGuest,
  roomId: Id<'rooms'>,
) {
  const existing = await ctx.db
    .query('matches')
    .withIndex('by_room', (q) => q.eq('roomId', roomId))
    .first();
  if (existing) return existing;

  const hostSquad = auction.host.squad.map((s) => s.playerId);
  const guestSquad = auction.guest.squad.map((s) => s.playerId);
  const matchId = await ctx.db.insert('matches', {
    roomId,
    hostSquad,
    guestSquad,
    score: { host: 0, guest: 0 },
    status: 'pending',
    seed: auction.seed,
    gameType: 'hidden_bid',
  });
  return (await ctx.db.get(matchId))!;
}

/** Hydrate main-XI card data into the pure engine's player shape. */
async function hydrateMains(
  ctx: GenericMutationCtx<DataModel>,
  squad: Array<{ playerId: Id<'players'> }>,
): Promise<SimPlayer[]> {
  const result: SimPlayer[] = [];
  for (const slot of squad) {
    const player = await ctx.db.get(slot.playerId);
    if (!player) continue;
    const [club, nation] = await Promise.all([
      ctx.db.get(player.clubId),
      ctx.db.get(player.nationId),
    ]);
    result.push({
      id: player._id,
      name: player.name,
      tier: player.tier,
      position: player.position,
      club: club?.name ?? '',
      nation: nation?.name ?? '',
    });
  }
  return result;
}

// ── Mutations ────────────────────────────────────────────────────

export const createFromAuction = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.optional(v.id('guestUsers')),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      await verifyGuestSession(ctx, args.userId, args.sessionToken);
    }
    const auction = await getCompletedAuction(ctx, args.roomId);
    const match = await ensureMatch(ctx, auction, args.roomId);
    return match._id;
  },
});

/**
 * Atomic Convex Simulation Trigger: hydrates both final squads, executes the
 * deterministic tactical engine with the room seed and persists the canonical
 * MatchSimulationResult for the Universal Score Hub.
 *
 * Invoking this twice returns the cached result — never re-rolls.
 */
export const runSimulation = mutation({
  args: {
    roomId: v.id('rooms'),
    userId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.userId, args.sessionToken);
    const auction = await getCompletedAuction(ctx, args.roomId);

    if (!isAuctionParticipant(auction, args.userId)) {
      throw new Error('Only auction participants can run the match simulation');
    }

    const match = await ensureMatch(ctx, auction, args.roomId);

    if (match.simulation) {
      return { matchId: match._id, simulation: match.simulation, cached: true };
    }

    const seed = auction.seed ?? `room:${args.roomId}`;
    const hostSquad = auction.host.squad;
    const guestSquad = auction.guest.squad;

    const [hostPlayers, guestPlayers] = await Promise.all([
      hydrateMains(ctx, hostSquad),
      hydrateMains(ctx, guestSquad),
    ]);

    const spentHost = auction.host.squad.reduce((sum, s) => sum + s.cost, 0);
    const spentGuest = auction.guest.squad.reduce((sum, s) => sum + s.cost, 0);

    const simulation = simulateTacticalMatch(
      args.roomId,
      hostPlayers,
      guestPlayers,
      auction.startingBudget - spentHost,
      auction.startingBudget - spentGuest,
      seed,
      {
        matchId: match._id,
        gameType: 'hidden_bid',
        hostUserId: auction.host.userId,
        guestUserId: auction.guest.userId,
      },
    );

    await ctx.db.patch(match._id, {
      simulation: { ...simulation, winnerId: simulation.winnerId ?? undefined },
      score: simulation.score,
      winnerId: (simulation.winnerId ?? undefined) as Id<'guestUsers'> | undefined,
      status: 'completed',
      completedAt: Date.now(),
    });

    // ── Platform Match Attribution & League Scoring Hook ──
    const room = await ctx.db.get(args.roomId);
    if (room) {
      // If there was a shootout or decisive winner, match is not a draw
      const isDraw = !simulation.winnerId && simulation.score.host === simulation.score.guest;
      const winnerUserId = simulation.winnerId
        ? (simulation.winnerId === auction.host.userId ? room.hostUserId : room.guestUserId)
        : simulation.score.host > simulation.score.guest
        ? room.hostUserId
        : simulation.score.guest > simulation.score.host
        ? room.guestUserId
        : undefined;

      // Only record history if at least one signed-in player was in this match
      if (room.hostUserId || room.guestUserId) {
        const pkSuffix = simulation.isShootout && simulation.shootoutScore
          ? ` (PK ${simulation.shootoutScore.host}-${simulation.shootoutScore.guest})`
          : '';
        await ctx.db.insert('gameResults', {
          gameType: 'snipe',
          context: room.leagueId ? 'league' : 'casual',
          leagueId: room.leagueId,
          player1UserId: room.hostUserId,
          player2UserId: room.guestUserId,
          player1GuestId: room.hostId,
          player2GuestId: room.guestId,
          player1Score: simulation.score.host,
          player2Score: simulation.score.guest,
          winnerUserId,
          isDraw,
          summary: `${simulation.score.host} - ${simulation.score.guest}${pkSuffix}`,
          completedAt: Date.now(),
        });
      }

      // If launched from a league, score league standings
      if (room.leagueId) {
        await scoreLeagueSnipeMatch(ctx, {
          roomId: room._id,
          hostScore: simulation.score.host,
          guestScore: simulation.score.guest,
          hostUserId: room.hostUserId,
          guestUserId: room.guestUserId,
          winnerUserId,
          isDraw,
        });
      }
    }

    return { matchId: match._id, simulation, cached: false };
  },
});


