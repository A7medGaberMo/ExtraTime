import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { v } from 'convex/values';

export const getDraftGame = query({
  args: {
    gameId: v.id('draftGames'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // 1. Collect all unique player IDs
    const playerIds = new Set<Id<'players'>>();
    for (const p of game.participants) {
      for (const slot of p.startingXI) if (slot.playerId) playerIds.add(slot.playerId);
      for (const slot of p.bench) if (slot.playerId) playerIds.add(slot.playerId);
      for (const cId of p.currentCandidateIds) playerIds.add(cId);
    }

    // 2. Fetch all players
    const playerDocs = await Promise.all(Array.from(playerIds).map((id) => ctx.db.get(id)));
    const playerMap = new Map(playerDocs.filter((p) => p !== null).map((p) => [p!._id, p!]));

    // 3. Collect unique club/nation IDs
    const clubIds = new Set<Id<'clubs'>>();
    const nationIds = new Set<Id<'nations'>>();
    for (const p of playerMap.values()) {
      if (p.clubId) clubIds.add(p.clubId);
      if (p.nationId) nationIds.add(p.nationId);
    }

    // 4. Fetch all clubs & nations
    const [clubDocs, nationDocs] = await Promise.all([
      Promise.all(Array.from(clubIds).map((id) => ctx.db.get(id))),
      Promise.all(Array.from(nationIds).map((id) => ctx.db.get(id))),
    ]);
    const clubMap = new Map(clubDocs.filter((c) => c !== null).map((c) => [c!._id, c!]));
    const nationMap = new Map(nationDocs.filter((n) => n !== null).map((n) => [n!._id, n!]));

    // 5. Helper to enrich a player
    const enrichPlayer = (playerId?: Id<'players'> | null) => {
      if (!playerId) return null;
      const p = playerMap.get(playerId);
      if (!p) return null;
      const c = clubMap.get(p.clubId);
      const n = nationMap.get(p.nationId);
      return {
        id: String(p._id),
        name: p.name,
        position: p.position,
        tier: p.tier,
        rating: p.rating,
        imageUrl: p.imageUrl,
        isLegend: p.isLegend,
        clubName: c?.name ?? '',
        clubLogo: c?.logo ?? '',
        league: c?.league ?? '',
        nationName: n?.name ?? '',
        nationFlag: n?.flag ?? '',
      };
    };

    // 6. Enrich participants
    const enrichedParticipants = game.participants.map((p) => ({
      ...p,
      startingXI: p.startingXI.map((slot) => ({
        ...slot,
        chemistry: slot.chemistry ?? 0,
        player: enrichPlayer(slot.playerId),
      })),
      bench: p.bench.map((slot) => ({
        ...slot,
        player: enrichPlayer(slot.playerId),
      })),
      currentCandidates: p.currentCandidateIds
        .map(enrichPlayer)
        .filter((c) => c !== null) as NonNullable<ReturnType<typeof enrichPlayer>>[],
    }));

    return {
      ...game,
      participants: enrichedParticipants,
    };
  },
});

export const getPublicQueueSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const waitingGames = await ctx.db
      .query('draftGames')
      .withIndex('by_public_status', (q) =>
        q.eq('isPublic', true).eq('status', 'waiting').eq('mode', 'duel_public'),
      )
      .take(20);

    const activeWaiting = waitingGames.filter((g) => g.createdAt > now - 3 * 60 * 1000);

    return {
      waitingCount: activeWaiting.length,
    };
  },
});

export const getSoloLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query('draftGames')
      .withIndex('by_status', (q) => q.eq('status', 'completed'))
      .take(50);

    const soloScores = games
      .filter((g) => g.mode === 'solo' && g.participants.length > 0)
      .map((g) => {
        const p = g.participants[0];
        return {
          gameId: g._id,
          playerName: p.name,
          formation: p.formation ?? '4-3-3',
          squadRating: p.squadRating,
          chemistryScore: p.chemistryScore,
          totalDraftScore: p.totalDraftScore,
          completedAt: g.completedAt ?? g.createdAt,
        };
      })
      .sort((a, b) => b.totalDraftScore - a.totalDraftScore)
      .slice(0, 10);

    return soloScores;
  },
});

export const getByCode = query({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('draftGames')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .first();

    if (!game) return null;

    const host = game.participants[0];
    return {
      gameId: game._id,
      code: game.code,
      status: game.status,
      isFull: game.participants.length >= 2,
      participantCount: game.participants.length,
      mode: game.mode,
      hostName: host?.name ?? 'Manager',
    };
  },
});

export const getRematchState = query({
  args: {
    gameId: v.id('draftGames'),
    guestId: v.id('guestUsers'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { status: 'none' as const };

    const rematchGameId = (game as Record<string, unknown>).rematchGameId as Id<'draftGames'> | undefined;
    if (!rematchGameId) return { status: 'none' as const };

    const rematchGame = await ctx.db.get(rematchGameId);
    if (!rematchGame) return { status: 'none' as const };

    const inviterId = (game as Record<string, unknown>).rematchInviterId as Id<'guestUsers'> | undefined;
    const iAmInviter = inviterId === args.guestId;

    let inviterName = 'Opponent';
    if (inviterId) {
      const inviterUser = await ctx.db.get(inviterId);
      if (inviterUser?.nickname) inviterName = inviterUser.nickname;
    }

    if (rematchGame.status === 'formation' || rematchGame.status === 'drafting') {
      return {
        status: 'accepted' as const,
        rematchGameId: rematchGame._id,
        iAmInviter,
        inviterName,
      };
    }

    if (rematchGame.status === 'abandoned') {
      return {
        status: 'declined' as const,
        rematchGameId: rematchGame._id,
        iAmInviter,
        inviterName,
      };
    }

    if (rematchGame.status === 'waiting') {
      return {
        status: 'pending' as const,
        rematchGameId: rematchGame._id,
        iAmInviter,
        inviterName,
      };
    }

    return { status: 'none' as const };
  },
});
