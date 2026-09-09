import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getDraftGame = query({
  args: {
    gameId: v.id('draftGames'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Enrich participants with player details
    const enrichedParticipants = await Promise.all(
      game.participants.map(async (p) => {
        // Enrich Starting XI
        const enrichedStarters = await Promise.all(
          p.startingXI.map(async (slot) => {
            if (!slot.playerId) {
              return {
                slotIndex: slot.slotIndex,
                position: slot.position,
                isCaptain: slot.isCaptain,
                chemistry: slot.chemistry ?? 0,
                player: null,
              };
            }
            const playerDoc = await ctx.db.get(slot.playerId);
            if (!playerDoc) return { ...slot, chemistry: slot.chemistry ?? 0, player: null };

            const clubDoc = await ctx.db.get(playerDoc.clubId);
            const nationDoc = await ctx.db.get(playerDoc.nationId);

            return {
              slotIndex: slot.slotIndex,
              position: slot.position,
              isCaptain: slot.isCaptain,
              chemistry: slot.chemistry ?? 0,
              player: {
                id: String(playerDoc._id),
                name: playerDoc.name,
                position: playerDoc.position,
                tier: playerDoc.tier,
                rating: playerDoc.rating,
                imageUrl: playerDoc.imageUrl,
                isLegend: playerDoc.isLegend,
                clubName: clubDoc?.name ?? '',
                clubLogo: clubDoc?.logo ?? '',
                league: clubDoc?.league ?? '',
                nationName: nationDoc?.name ?? '',
                nationFlag: nationDoc?.flag ?? '',
              },
            };
          }),
        );

        // Enrich Bench
        const enrichedBench = await Promise.all(
          p.bench.map(async (slot) => {
            if (!slot.playerId) {
              return {
                benchIndex: slot.benchIndex,
                player: null,
              };
            }
            const playerDoc = await ctx.db.get(slot.playerId);
            if (!playerDoc) return { ...slot, player: null };

            const clubDoc = await ctx.db.get(playerDoc.clubId);
            const nationDoc = await ctx.db.get(playerDoc.nationId);

            return {
              benchIndex: slot.benchIndex,
              player: {
                id: String(playerDoc._id),
                name: playerDoc.name,
                position: playerDoc.position,
                tier: playerDoc.tier,
                rating: playerDoc.rating,
                imageUrl: playerDoc.imageUrl,
                isLegend: playerDoc.isLegend,
                clubName: clubDoc?.name ?? '',
                clubLogo: clubDoc?.logo ?? '',
                league: clubDoc?.league ?? '',
                nationName: nationDoc?.name ?? '',
                nationFlag: nationDoc?.flag ?? '',
              },
            };
          }),
        );

        // Enrich Current Candidate Cards
        const candidateCards = await Promise.all(
          p.currentCandidateIds.map(async (cId) => {
            const playerDoc = await ctx.db.get(cId);
            if (!playerDoc) return null;

            const clubDoc = await ctx.db.get(playerDoc.clubId);
            const nationDoc = await ctx.db.get(playerDoc.nationId);

            return {
              id: String(playerDoc._id),
              name: playerDoc.name,
              position: playerDoc.position,
              tier: playerDoc.tier,
              rating: playerDoc.rating,
              imageUrl: playerDoc.imageUrl,
              isLegend: playerDoc.isLegend,
              clubName: clubDoc?.name ?? '',
              clubLogo: clubDoc?.logo ?? '',
              league: clubDoc?.league ?? '',
              nationName: nationDoc?.name ?? '',
              nationFlag: nationDoc?.flag ?? '',
            };
          }),
        );

        return {
          ...p,
          startingXI: enrichedStarters,
          bench: enrichedBench,
          currentCandidates: candidateCards.filter((c): c is NonNullable<typeof c> => c !== null),
        };
      }),
    );

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
