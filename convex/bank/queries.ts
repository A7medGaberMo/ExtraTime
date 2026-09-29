import { query } from '../_generated/server';
import { v } from 'convex/values';
import { Id } from '../_generated/dataModel';

/**
 * Returns full reactive game state for Bank It.
 */
export const getGame = query({
  args: { gameId: v.id('bankGames') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Sanitize game document for the client
    const sanitizedParticipants = game.participants.map((p) => ({
      guestId: p.guestId,
      name: p.name,
      avatarSeed: p.avatarSeed,
      totalBankedScore: p.totalBankedScore,
      roundScores: p.roundScores,
      totalCorrectAnswers: p.totalCorrectAnswers,
      totalQuestionsAnswered: p.totalQuestionsAnswered,
      totalTimeUsedMs: p.totalTimeUsedMs,
      highestStreak: p.highestStreak,
      lastPingAt: p.lastPingAt,
    }));

    return {
      _id: game._id,
      code: game.code,
      mode: game.mode,
      status: game.status,
      roundCount: game.roundCount,
      currentRound: game.currentRound,
      activeTurnPlayerIndex: game.activeTurnPlayerIndex,
      runStartedAt: game.runStartedAt,
      runDeadline: game.runDeadline,
      suddenDeathDeadline: game.suddenDeathDeadline,
      currentQuestionIndex: game.currentQuestionIndex,
      currentStreak: game.currentStreak,
      unbankedPoints: game.unbankedPoints,
      lastAction: game.lastAction,
      participants: sanitizedParticipants,
      suddenDeathState: game.suddenDeathState
        ? {
            pairIndex: game.suddenDeathState.pairIndex,
            player1Correct: game.suddenDeathState.player1Correct,
            player2Correct: game.suddenDeathState.player2Correct,
          }
        : undefined,
      winnerId: game.winnerId,
      isDraw: game.isDraw,
      abandonedBy: game.abandonedBy,
      createdAt: game.createdAt,
      completedAt: game.completedAt,
      rematchGameId: game.rematchGameId,
    };
  },
});

/**
 * Strips correctId from bank question for client security.
 * Spectators and active players only see question & options.
 * Restricts sudden death golden question visibility strictly to the active player.
 */
export const getCurrentQuestion = query({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.optional(v.union(v.id('guestUsers'), v.string())),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    let targetQuestionId: Id<'bankQuestions'> | undefined;

    if (game.status === 'sudden_death' && game.suddenDeathState) {
      const activeGuestId = game.participants[game.activeTurnPlayerIndex]?.guestId;
      // Strictly restrict sudden death question visibility only to the active player
      if (!args.guestId || args.guestId !== activeGuestId) {
        return null;
      }

      const sd = game.suddenDeathState;
      const isPlayer0 = game.activeTurnPlayerIndex === 0;
      targetQuestionId = isPlayer0 ? sd.questionIds[0] : sd.questionIds[1] ?? sd.questionIds[0];
    } else if (game.status === 'in_progress') {
      targetQuestionId = game.turnQuestionIds[game.currentQuestionIndex];
    }

    if (!targetQuestionId) return null;

    const rawQuestion = await ctx.db.get(targetQuestionId);
    if (!rawQuestion) return null;

    return {
      _id: rawQuestion._id,
      question: rawQuestion.question,
      options: rawQuestion.options,
      type: rawQuestion.type,
      category: rawQuestion.category,
      difficulty: rawQuestion.difficulty,
    };
  },
});

/**
 * Returns active waiting public duel queues.
 */
export const getPublicQueueSummary = query({
  args: {},
  handler: async (ctx) => {
    const waiting = await ctx.db
      .query('bankGames')
      .withIndex('by_public_waiting', (q) => q.eq('mode', 'duel_public').eq('status', 'waiting'))
      .collect();

    return {
      waitingCount: waiting.length,
    };
  },
});

/**
 * Returns personal best stats for a guest player in solo runs.
 */
export const getPersonalBest = query({
  args: { guestId: v.id('guestUsers') },
  handler: async (ctx, args) => {
    const stats = await ctx.db
      .query('guestStats')
      .withIndex('by_guest', (q) => q.eq('guestId', args.guestId))
      .first();

    return {
      personalBestScore: stats?.personalBestScore ?? 0,
      highestStreak: stats?.highestStreak ?? 0,
      totalSoloGames: stats?.totalSoloGames ?? 0,
      totalCorrect: stats?.totalCorrect ?? 0,
    };
  },
});

/**
 * Returns a Bank game by its 6-character room code for lobby lookups.
 */
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const cleanCode = args.code.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 6);
    const rawCode = args.code.trim().toUpperCase();

    let game = await ctx.db
      .query('bankGames')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!game && rawCode !== cleanCode) {
      game = await ctx.db
        .query('bankGames')
        .withIndex('by_code', (q) => q.eq('code', rawCode))
        .first();
    }

    if (!game) return null;

    return {
      _id: game._id,
      code: game.code,
      status: game.status,
      mode: game.mode,
      hostName: game.participants[0]?.name ?? 'Host',
      participantsCount: game.participants.length,
      isFull: game.participants.length >= 2,
    };
  },
});


export const getRematchState = query({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { status: 'none' as const };

    const rematchGameId = (game as Record<string, unknown>).rematchGameId as Id<'bankGames'> | undefined;
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

    if (rematchGame.status === 'in_progress' || rematchGame.status === 'sudden_death') {
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
