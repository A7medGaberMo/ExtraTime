import { mutation, internalMutation } from '../_generated/server';
import { v } from 'convex/values';
import { Id, DataModel, Doc } from '../_generated/dataModel';
import { GenericMutationCtx } from 'convex/server';
import { internal } from '../_generated/api';
import { verifyGuestSession } from '../lib/auth';
import {
  calculateLadderPoints,
  allocateStratifiedQuestions,
  generateBankRoomCode,
  normalizeBankRoomCode,
  RUN_DURATION_MS,
  SUDDEN_DEATH_DURATION_MS,
} from './engine';

const FALLBACK_GUEST_NAME = 'Guest Challenger';

async function getGuestProfile(ctx: GenericMutationCtx<DataModel>, guestId: Id<'guestUsers'>) {
  const guest = await ctx.db.get(guestId);
  return {
    nickname: guest?.nickname ?? FALLBACK_GUEST_NAME,
    avatarSeed: guest?.avatarSeed ?? guestId,
  };
}

async function generateUniqueBankRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateBankRoomCode();
    const existing = await ctx.db
      .query('bankGames')
      .withIndex('by_code', (q) => q.eq('code', code))
      .first();
    if (!existing) return code;
  }
  throw new Error('Could not generate a unique bank room code');
}

async function pickGoldenQuestions(ctx: GenericMutationCtx<DataModel>): Promise<Id<'bankQuestions'>[]> {
  const candidates = await ctx.db
    .query('bankQuestions')
    .withIndex('by_difficulty_type', (q) =>
      q.eq('isActive', true).eq('difficulty', 'hard').eq('type', 'mcq')
    )
    .take(20);

  if (candidates.length >= 2) {
    const idx1 = Math.floor(Math.random() * candidates.length);
    let idx2 = Math.floor(Math.random() * candidates.length);
    while (idx2 === idx1 && candidates.length > 1) {
      idx2 = Math.floor(Math.random() * candidates.length);
    }
    return [candidates[idx1]._id, candidates[idx2]._id];
  }

  const fallback = await ctx.db
    .query('bankQuestions')
    .withIndex('by_active', (q) => q.eq('isActive', true))
    .take(10);

  if (fallback.length === 0) {
    throw new Error('No active bank questions available');
  }
  if (fallback.length === 1) {
    return [fallback[0]._id, fallback[0]._id];
  }
  return [fallback[0]._id, fallback[1]._id];
}

/**
 * Unified Run Finalization Engine.
 * Called identically on early question completion (all 12 answered) OR 90s server/client timeout.
 */
async function finalizeRun(
  ctx: GenericMutationCtx<DataModel>,
  game: Doc<'bankGames'>,
  opts: { isTimeout?: boolean; is12thQuestion?: boolean }
) {
  const now = Date.now();
  const startedAt = game.runStartedAt ?? now;
  const elapsedMs = opts.isTimeout
    ? RUN_DURATION_MS
    : Math.min(RUN_DURATION_MS, Math.max(0, now - startedAt));

  const participants = [...game.participants];
  const activeP = { ...participants[game.activeTurnPlayerIndex] };
  activeP.totalTimeUsedMs += elapsedMs;

  // Auto-bank at finish:
  // Whenever a run finishes (whether by timeout OR early question completion),
  // automatically secure any unbanked points into totalBankedScore!
  if (game.unbankedPoints > 0) {
    activeP.totalBankedScore += game.unbankedPoints;
  }

  participants[game.activeTurnPlayerIndex] = activeP;

  // Reset unbanked streak points for the completed run
  const currentStreak = 0;
  const unbankedPoints = 0;

  // --- SOLO MODE ---
  if (game.mode === 'solo') {
    activeP.roundScores = [activeP.totalBankedScore];
    await ctx.db.patch(game._id, {
      status: 'completed',
      completedAt: now,
      currentStreak,
      unbankedPoints,
      participants,
    });

    const stats = await ctx.db
      .query('guestStats')
      .withIndex('by_guest', (q) => q.eq('guestId', activeP.guestId))
      .first();

    if (stats) {
      await ctx.db.patch(stats._id, {
        personalBestScore: Math.max(stats.personalBestScore, activeP.totalBankedScore),
        highestStreak: Math.max(stats.highestStreak, activeP.highestStreak),
        totalSoloGames: stats.totalSoloGames + 1,
        totalCorrect: stats.totalCorrect + activeP.totalCorrectAnswers,
      });
    } else {
      await ctx.db.insert('guestStats', {
        guestId: activeP.guestId,
        personalBestScore: activeP.totalBankedScore,
        highestStreak: activeP.highestStreak,
        totalSoloGames: 1,
        totalCorrect: activeP.totalCorrectAnswers,
      });
    }

    return { completed: true };
  }

  // --- 1v1 DUEL MODE ---
  // Duel order:
  // Round 1: Turn 0 (P1) -> Turn 1 (P2)
  // Round 2: Turn 0 (P2) -> Turn 1 (P1)
  const isRound1Turn0 = game.currentRound === 1 && game.activeTurnPlayerIndex === 0;
  const isRound1Turn1 = game.currentRound === 1 && game.activeTurnPlayerIndex === 1;
  const isRound2Turn0 = game.currentRound === 2 && game.activeTurnPlayerIndex === 1;
  const isRound2Turn1 = game.currentRound === 2 && game.activeTurnPlayerIndex === 0;

  if (isRound1Turn0) {
    // P1 finished R1. Transition to P2 (Round 1, Turn 1)
    const nextTurnPlayerIndex = 1;
    const nextQuestions = game.duelQuestionRuns?.[1] ?? game.turnQuestionIds;
    const runStartedAt = now;
    const runDeadline = now + RUN_DURATION_MS;

    await ctx.db.patch(game._id, {
      activeTurnPlayerIndex: nextTurnPlayerIndex,
      turnQuestionIds: nextQuestions,
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      runStartedAt,
      runDeadline,
      participants,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId: game._id,
        expectedRound: 1,
        expectedTurnPlayerIndex: nextTurnPlayerIndex,
      }
    );
    return { nextTurn: true };
  }

  if (isRound1Turn1) {
    // P2 finished R1. Round 1 is complete!
    // Lock round 1 scores
    participants[0].roundScores = [participants[0].totalBankedScore];
    participants[1].roundScores = [participants[1].totalBankedScore];

    // Transition to Round 2! P2 runs first in Round 2.
    const nextRound = 2;
    const nextTurnPlayerIndex = 1; // P2 goes first
    const nextQuestions = game.duelQuestionRuns?.[2] ?? game.turnQuestionIds;
    const runStartedAt = now;
    const runDeadline = now + RUN_DURATION_MS;

    await ctx.db.patch(game._id, {
      currentRound: nextRound,
      activeTurnPlayerIndex: nextTurnPlayerIndex,
      turnQuestionIds: nextQuestions,
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      runStartedAt,
      runDeadline,
      participants,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId: game._id,
        expectedRound: nextRound,
        expectedTurnPlayerIndex: nextTurnPlayerIndex,
      }
    );
    return { nextRound: true };
  }

  if (isRound2Turn0) {
    // P2 finished R2 Turn 1. Transition to P1 for the final regulation run!
    const nextTurnPlayerIndex = 0; // P1
    const nextQuestions = game.duelQuestionRuns?.[3] ?? game.turnQuestionIds;
    const runStartedAt = now;
    const runDeadline = now + RUN_DURATION_MS;

    await ctx.db.patch(game._id, {
      activeTurnPlayerIndex: nextTurnPlayerIndex,
      turnQuestionIds: nextQuestions,
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      runStartedAt,
      runDeadline,
      participants,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId: game._id,
        expectedRound: 2,
        expectedTurnPlayerIndex: nextTurnPlayerIndex,
      }
    );
    return { nextTurn: true };
  }

  if (isRound2Turn1) {
    // P1 finished R2 Turn 2! Both rounds completed!
    const r1ScoreP0 = participants[0].roundScores[0] ?? 0;
    const r1ScoreP1 = participants[1].roundScores[0] ?? 0;
    participants[0].roundScores = [r1ScoreP0, participants[0].totalBankedScore - r1ScoreP0];
    participants[1].roundScores = [r1ScoreP1, participants[1].totalBankedScore - r1ScoreP1];

    const score0 = participants[0].totalBankedScore;
    const score1 = participants[1].totalBankedScore;

    if (score0 > score1) {
      await ctx.db.patch(game._id, {
        status: 'completed',
        winnerId: participants[0].guestId,
        completedAt: now,
        participants,
        currentStreak: 0,
        unbankedPoints: 0,
      });
      return { winner: participants[0].guestId };
    }

    if (score1 > score0) {
      await ctx.db.patch(game._id, {
        status: 'completed',
        winnerId: participants[1].guestId,
        completedAt: now,
        participants,
        currentStreak: 0,
        unbankedPoints: 0,
      });
      return { winner: participants[1].guestId };
    }

    // TIE! Launch Sudden Death Shootout ("سؤال الحسم")
    const goldenQuestions = await pickGoldenQuestions(ctx);
    const sdDeadline = now + SUDDEN_DEATH_DURATION_MS;

    await ctx.db.patch(game._id, {
      status: 'sudden_death',
      suddenDeathDeadline: sdDeadline,
      suddenDeathState: {
        pairIndex: 1,
        questionIds: goldenQuestions,
      },
      activeTurnPlayerIndex: 0,
      participants,
      currentStreak: 0,
      unbankedPoints: 0,
    });

    await ctx.scheduler.runAt(
      sdDeadline,
      internal.bank.mutations.authoritativeExpireSuddenDeath,
      {
        gameId: game._id,
        expectedPairIndex: 1,
        expectedTurnPlayerIndex: 0,
      }
    );
    return { suddenDeath: true };
  }

  return { complete: true };
}

// ── Public Mutations ────────────────────────────────────────────────────────

/**
 * Creates a Solo Bank It run (90s countdown, 12 questions).
 */
export const createSoloGame = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);
    const now = Date.now();
    const code = await generateUniqueBankRoomCode(ctx);

    const { runs } = await allocateStratifiedQuestions(ctx, [args.guestId], false);
    const runDeadline = now + RUN_DURATION_MS;

    const gameId = await ctx.db.insert('bankGames', {
      code,
      mode: 'solo',
      player1Id: args.guestId,
      status: 'in_progress',
      roundCount: 1,
      currentRound: 1,
      activeTurnPlayerIndex: 0,
      runStartedAt: now,
      runDeadline,
      turnQuestionIds: runs[0],
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          totalBankedScore: 0,
          roundScores: [],
          totalCorrectAnswers: 0,
          totalQuestionsAnswered: 0,
          totalTimeUsedMs: 0,
          highestStreak: 0,
          lastPingAt: now,
        },
      ],
      createdAt: now,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId,
        expectedRound: 1,
        expectedTurnPlayerIndex: 0,
      }
    );

    return { gameId, code };
  },
});

/**
 * Creates a private 1v1 Bank It room with a shareable 6-character code.
 */
export const createDuelPrivateRoom = mutation({
  args: {
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);
    const host = await getGuestProfile(ctx, args.hostId);
    const now = Date.now();
    const code = await generateUniqueBankRoomCode(ctx);

    const gameId = await ctx.db.insert('bankGames', {
      code,
      mode: 'duel_private',
      player1Id: args.hostId,
      status: 'waiting',
      roundCount: 2,
      currentRound: 1,
      activeTurnPlayerIndex: 0,
      turnQuestionIds: [], // generated when opponent joins
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      participants: [
        {
          guestId: args.hostId,
          name: host.nickname,
          avatarSeed: host.avatarSeed,
          totalBankedScore: 0,
          roundScores: [],
          totalCorrectAnswers: 0,
          totalQuestionsAnswered: 0,
          totalTimeUsedMs: 0,
          highestStreak: 0,
          lastPingAt: now,
        },
      ],
      createdAt: now,
    });

    return { gameId, code };
  },
});

/**
 * Joins a private 1v1 duel room by 6-character code.
 */
export const joinDuelPrivateRoom = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);

    const cleanCode = normalizeBankRoomCode(args.code);
    const game = await ctx.db
      .query('bankGames')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!game) throw new Error('Room not found. Please check the 6-character code.');
    if (game.participants.some((p) => p.guestId === args.guestId)) {
      return { gameId: game._id }; // Seamless reconnect
    }
    if (game.status !== 'waiting') throw new Error('This room is already in progress or completed.');
    if (game.participants.length >= 2) throw new Error('This room is full.');

    const now = Date.now();
    const { runs } = await allocateStratifiedQuestions(ctx, [game.player1Id, args.guestId], true);
    const runDeadline = now + RUN_DURATION_MS;

    const updatedParticipants = [
      ...game.participants,
      {
        guestId: args.guestId,
        name: guest.nickname,
        avatarSeed: guest.avatarSeed,
        totalBankedScore: 0,
        roundScores: [],
        totalCorrectAnswers: 0,
        totalQuestionsAnswered: 0,
        totalTimeUsedMs: 0,
        highestStreak: 0,
        lastPingAt: now,
      },
    ];

    await ctx.db.patch(game._id, {
      player2Id: args.guestId,
      status: 'in_progress',
      turnQuestionIds: runs[0],
      duelQuestionRuns: runs,
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      runStartedAt: now,
      runDeadline,
      participants: updatedParticipants,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId: game._id,
        expectedRound: 1,
        expectedTurnPlayerIndex: 0,
      }
    );

    return { gameId: game._id };
  },
});

/**
 * Quick Match: Joins an open public matchmaking queue or creates a waiting lobby.
 */
export const findOrCreatePublicMatch = mutation({
  args: {
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);
    const now = Date.now();

    // Look for open public room created within the last 3 minutes
    const openRooms = await ctx.db
      .query('bankGames')
      .withIndex('by_public_waiting', (q) =>
        q.eq('mode', 'duel_public').eq('status', 'waiting')
      )
      .take(20);

    const available = openRooms.find(
      (r) =>
        r.createdAt > now - 180_000 &&
        r.participants.length === 1 &&
        r.participants[0].guestId !== args.guestId
    );

    if (available) {
      // Join existing waiting room
      const { runs } = await allocateStratifiedQuestions(
        ctx,
        [available.player1Id, args.guestId],
        true
      );
      const runDeadline = now + RUN_DURATION_MS;

      const updatedParticipants = [
        ...available.participants,
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          totalBankedScore: 0,
          roundScores: [],
          totalCorrectAnswers: 0,
          totalQuestionsAnswered: 0,
          totalTimeUsedMs: 0,
          highestStreak: 0,
          lastPingAt: now,
        },
      ];

      await ctx.db.patch(available._id, {
        player2Id: args.guestId,
        status: 'in_progress',
        turnQuestionIds: runs[0],
        duelQuestionRuns: runs,
        currentQuestionIndex: 0,
        currentStreak: 0,
        unbankedPoints: 0,
        runStartedAt: now,
        runDeadline,
        participants: updatedParticipants,
      });

      await ctx.scheduler.runAt(
        runDeadline,
        internal.bank.mutations.authoritativeExpireRun,
        {
          gameId: available._id,
          expectedRound: 1,
          expectedTurnPlayerIndex: 0,
        }
      );

      return { gameId: available._id, matched: true };
    }

    // Create a new public lobby
    const code = await generateUniqueBankRoomCode(ctx);
    const gameId = await ctx.db.insert('bankGames', {
      code,
      mode: 'duel_public',
      player1Id: args.guestId,
      status: 'waiting',
      roundCount: 2,
      currentRound: 1,
      activeTurnPlayerIndex: 0,
      turnQuestionIds: [],
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          totalBankedScore: 0,
          roundScores: [],
          totalCorrectAnswers: 0,
          totalQuestionsAnswered: 0,
          totalTimeUsedMs: 0,
          highestStreak: 0,
          lastPingAt: now,
        },
      ],
      createdAt: now,
    });

    return { gameId, matched: false };
  },
});

/**
 * Submits an answer for the active question.
 * Boundary-checks the 90s server deadline, calculates ladder points, and manages transitions.
 */
export const submitAnswer = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    optionId: v.string(), // "a", "b", "c", "d" or "true", "false"
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'in_progress') throw new Error('Game is not active');

    const activeParticipant = game.participants[game.activeTurnPlayerIndex];
    if (activeParticipant.guestId !== args.guestId) {
      throw new Error('Not your turn to answer');
    }

    const now = Date.now();
    // 1. Authoritative deadline boundary check
    if (game.runDeadline && now > game.runDeadline) {
      await finalizeRun(ctx, game, { isTimeout: true });
      return { expired: true, message: "Time's up!" };
    }

    const currentQuestionId = game.turnQuestionIds[game.currentQuestionIndex];
    const question = await ctx.db.get(currentQuestionId);
    if (!question) throw new Error('Question not found');

    const isCorrect = args.optionId.toLowerCase() === question.correctId.toLowerCase();
    const is12thQuestion = game.currentQuestionIndex === 11;

    const participants = [...game.participants];
    const p = { ...activeParticipant };
    p.totalQuestionsAnswered += 1;

    if (isCorrect) {
      const newStreak = game.currentStreak + 1;
      const pointsEarned = calculateLadderPoints(newStreak);
      p.totalCorrectAnswers += 1;
      p.highestStreak = Math.max(p.highestStreak, newStreak);
      participants[game.activeTurnPlayerIndex] = p;

      const lastAction = {
        type: 'correct' as const,
        questionId: question._id,
        selectedOptionId: args.optionId,
        correctOptionId: question.correctId,
        pointsEarned,
        newStreak,
        newBankedTotal: p.totalBankedScore,
        timestamp: now,
      };

      if (is12thQuestion) {
        // Player answered question 12 correctly!
        // Automatically bank the final jackpot points and cleanly finalize the run!
        p.totalBankedScore += pointsEarned;
        participants[game.activeTurnPlayerIndex] = p;

        const finalAction = {
          type: 'correct' as const,
          questionId: question._id,
          selectedOptionId: args.optionId,
          correctOptionId: question.correctId,
          pointsEarned,
          newStreak,
          newBankedTotal: p.totalBankedScore,
          timestamp: now,
        };

        await ctx.db.patch(game._id, {
          currentQuestionIndex: 12,
          currentStreak: newStreak,
          unbankedPoints: 0,
          lastAction: finalAction,
          participants,
        });

        await finalizeRun(
          ctx,
          { ...game, participants, currentStreak: newStreak, unbankedPoints: 0 },
          { is12thQuestion: true }
        );
        return {
          correct: true,
          pointsEarned,
          streak: newStreak,
          banked: true,
          finished: true,
          newTotal: p.totalBankedScore,
          correctOptionId: question.correctId,
        };
      }

      // Advance to next question in run
      await ctx.db.patch(game._id, {
        currentQuestionIndex: game.currentQuestionIndex + 1,
        currentStreak: newStreak,
        unbankedPoints: pointsEarned,
        lastAction,
        participants,
      });

      return { correct: true, pointsEarned, streak: newStreak, correctOptionId: question.correctId };
    } else {
      // WRONG ANSWER: unbanked points in current streak are wiped!
      participants[game.activeTurnPlayerIndex] = p;
      const lastAction = {
        type: 'wrong' as const,
        questionId: question._id,
        selectedOptionId: args.optionId,
        correctOptionId: question.correctId,
        pointsEarned: 0,
        newStreak: 0,
        newBankedTotal: p.totalBankedScore,
        timestamp: now,
      };

      if (is12thQuestion) {
        await ctx.db.patch(game._id, {
          lastAction,
          participants,
        });
        await finalizeRun(ctx, { ...game, participants }, { is12thQuestion: true });
        return { correct: false, finished: true, correctOptionId: question.correctId };
      }

      // Advance to next question with 0 streak and 0 unbanked points
      await ctx.db.patch(game._id, {
        currentQuestionIndex: game.currentQuestionIndex + 1,
        currentStreak: 0,
        unbankedPoints: 0,
        lastAction,
        participants,
      });

      return { correct: false, streak: 0, correctOptionId: question.correctId };
    }
  },
});

/**
 * Banks accumulated streak points into permanent banked score.
 * Does NOT advance the question; player keeps playing from current question.
 */
export const bankPoints = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'in_progress') throw new Error('Game is not active');

    const activeParticipant = game.participants[game.activeTurnPlayerIndex];
    if (activeParticipant.guestId !== args.guestId) {
      throw new Error('Not your turn to bank');
    }

    const now = Date.now();
    // Authoritative deadline boundary check
    if (game.runDeadline && now > game.runDeadline) {
      await finalizeRun(ctx, game, { isTimeout: true });
      return { expired: true, message: "Time's up!" };
    }

    if (game.unbankedPoints <= 0) {
      if (game.currentQuestionIndex >= 12) {
        await finalizeRun(ctx, game, { is12thQuestion: true });
        return { banked: 0, total: activeParticipant.totalBankedScore, completed: true };
      }
      return { banked: 0, total: activeParticipant.totalBankedScore };
    }

    const pointsToBank = game.unbankedPoints;
    const participants = [...game.participants];
    const p = { ...activeParticipant };
    p.totalBankedScore += pointsToBank;
    participants[game.activeTurnPlayerIndex] = p;

    const qIndex = Math.min(game.currentQuestionIndex, Math.max(0, game.turnQuestionIds.length - 1));
    const currentQuestionId = game.turnQuestionIds[qIndex];

    const lastAction = {
      type: 'bank' as const,
      questionId: currentQuestionId,
      correctOptionId: '',
      pointsEarned: pointsToBank,
      newStreak: 0,
      newBankedTotal: p.totalBankedScore,
      timestamp: now,
    };

    await ctx.db.patch(game._id, {
      currentStreak: 0,
      unbankedPoints: 0,
      lastAction,
      participants,
    });

    if (game.currentQuestionIndex >= 12) {
      await finalizeRun(ctx, { ...game, participants }, { is12thQuestion: true });
      return { banked: pointsToBank, newTotal: p.totalBankedScore, completed: true };
    }

    return { banked: pointsToBank, newTotal: p.totalBankedScore };
  },
});

/**
 * Passes the current question. Resets unbanked streak to 0 and advances question.
 */
export const passQuestion = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'in_progress') throw new Error('Game is not active');

    const activeParticipant = game.participants[game.activeTurnPlayerIndex];
    if (activeParticipant.guestId !== args.guestId) {
      throw new Error('Not your turn to pass');
    }

    const now = Date.now();
    if (game.runDeadline && now > game.runDeadline) {
      await finalizeRun(ctx, game, { isTimeout: true });
      return { expired: true, message: "Time's up!" };
    }

    const currentQuestionId = game.turnQuestionIds[game.currentQuestionIndex];
    const is12thQuestion = game.currentQuestionIndex === 11;

    const lastAction = {
      type: 'pass' as const,
      questionId: currentQuestionId,
      correctOptionId: '',
      pointsEarned: 0,
      newStreak: 0,
      newBankedTotal: activeParticipant.totalBankedScore,
      timestamp: now,
    };

    if (is12thQuestion) {
      await ctx.db.patch(game._id, { lastAction });
      await finalizeRun(ctx, game, { is12thQuestion: true });
      return { passed: true, finished: true };
    }

    await ctx.db.patch(game._id, {
      currentQuestionIndex: game.currentQuestionIndex + 1,
      currentStreak: 0,
      unbankedPoints: 0,
      lastAction,
    });

    return { passed: true, nextIndex: game.currentQuestionIndex + 1 };
  },
});

/**
 * Headless background WebSocket heartbeat ping.
 * Decoupled completely from user taps or thinking time.
 */
export const heartbeatPing = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false };

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) return { success: false };

    const now = Date.now();
    const lastPing = game.participants[pIndex].lastPingAt;
    
    // Avoid writing if we pinged recently (e.g. < 20 seconds ago)
    if (now - lastPing < 20000) {
      return { success: true };
    }

    const participants = [...game.participants];
    participants[pIndex] = {
      ...participants[pIndex],
      lastPingAt: now,
    };

    await ctx.db.patch(game._id, { participants });
    return { success: true };
  },
});

/**
 * Allows an active player to claim victory by forfeit if the opponent has been
 * disconnected (headless heartbeat missing) for > 90 seconds.
 */
export const claimOpponentAbandon = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status === 'completed' || game.status === 'abandoned') {
      return { alreadyResolved: true };
    }

    const callerIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (callerIndex === -1) throw new Error('Not a participant in this game');

    const opponentIndex = callerIndex === 0 ? 1 : 0;
    const opponent = game.participants[opponentIndex];
    if (!opponent) throw new Error('No opponent found');

    const now = Date.now();
    const isInactive = now - opponent.lastPingAt > 90_000;

    if (!isInactive) {
      throw new Error('Opponent is still connected or has not reached the 90-second abandonment threshold');
    }

    await ctx.db.patch(game._id, {
      status: 'completed',
      winnerId: args.guestId,
      abandonedBy: opponent.guestId,
      completedAt: now,
    });

    return { claimed: true, winnerId: args.guestId };
  },
});

/**
 * Immediate surrender/forfeit.
 */
export const forfeitMatch = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const now = Date.now();
    if (game.status === 'waiting') {
      await ctx.db.patch(game._id, {
        status: 'abandoned',
        abandonedBy: args.guestId,
        completedAt: now,
      });
      return { forfeited: true };
    }

    const opponent = game.participants.find((p) => p.guestId !== args.guestId);
    await ctx.db.patch(game._id, {
      status: 'completed',
      winnerId: opponent?.guestId,
      abandonedBy: args.guestId,
      completedAt: now,
    });

    return { forfeited: true, winnerId: opponent?.guestId };
  },
});

/**
 * Client countdown timer expiration handler with staleness and authority guards.
 */
export const handleTimeExpiry = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    expectedRound: v.number(),
    expectedTurnPlayerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) return { ignored: true, reason: 'game_not_found' };

    const isParticipant = game.participants.some((p) => p.guestId === args.guestId);
    if (!isParticipant) {
      return { ignored: true, reason: 'not_authorized' };
    }

    if (
      game.status !== 'in_progress' ||
      game.currentRound !== args.expectedRound ||
      game.activeTurnPlayerIndex !== args.expectedTurnPlayerIndex
    ) {
      return { ignored: true, reason: 'stale_turn_or_round' };
    }

    const now = Date.now();
    // Authoritative deadline guard: allow maximum 1.5s clock tolerance
    if (game.runDeadline && now < game.runDeadline - 1500) {
      return { ignored: true, reason: 'deadline_not_reached' };
    }

    await finalizeRun(ctx, game, { isTimeout: true });
    return { resolved: true };
  },
});

/**
 * Authoritative internal mutation invoked by ctx.scheduler.runAt for 90s regulation runs.
 */
export const authoritativeExpireRun = internalMutation({
  args: {
    gameId: v.id('bankGames'),
    expectedRound: v.number(),
    expectedTurnPlayerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    if (
      game.status !== 'in_progress' ||
      game.currentRound !== args.expectedRound ||
      game.activeTurnPlayerIndex !== args.expectedTurnPlayerIndex
    ) {
      return; // Turn transitioned ahead of time
    }

    await finalizeRun(ctx, game, { isTimeout: true });
  },
});

// ── Sudden Death Mutations ──────────────────────────────────────────────────

/**
 * Submits an answer for the 15s Golden Question in Sudden Death Shootout.
 */
export const submitSuddenDeathAnswer = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');
    if (game.status !== 'sudden_death' || !game.suddenDeathState) {
      throw new Error('Match is not in sudden death');
    }

    const now = Date.now();
    const sd = game.suddenDeathState;
    const isPlayer0 = game.activeTurnPlayerIndex === 0;
    const expectedGuestId = game.participants[game.activeTurnPlayerIndex]?.guestId;

    if (args.guestId !== expectedGuestId) {
      throw new Error('Not your turn in sudden death');
    }

    // Boundary check for 15s golden question
    const isExpired = game.suddenDeathDeadline && now > game.suddenDeathDeadline;
    const currentQId = isPlayer0 ? sd.questionIds[0] : sd.questionIds[1] ?? sd.questionIds[0];
    const rawQuestion = await ctx.db.get(currentQId);
    if (!rawQuestion) throw new Error('Question not found');

    const isCorrect =
      !isExpired && args.optionId.toLowerCase() === rawQuestion.correctId.toLowerCase();

    if (isPlayer0) {
      // Player 0 answered. Transition to Player 1!
      const sdDeadline = now + SUDDEN_DEATH_DURATION_MS;
      await ctx.db.patch(game._id, {
        activeTurnPlayerIndex: 1,
        suddenDeathDeadline: sdDeadline,
        suddenDeathState: {
          ...sd,
          player1Correct: isCorrect,
        },
      });

      await ctx.scheduler.runAt(
        sdDeadline,
        internal.bank.mutations.authoritativeExpireSuddenDeath,
        {
          gameId: game._id,
          expectedPairIndex: sd.pairIndex,
          expectedTurnPlayerIndex: 1,
        }
      );

      return { answered: true, waitingForOpponent: true };
    } else {
      // Player 1 answered. Both players in this pair are done!
      const p1Correct = sd.player1Correct ?? false;
      const player2Correct = isCorrect;

      if (p1Correct && !player2Correct) {
        // Player 1 wins!
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[0].guestId,
          completedAt: now,
          suddenDeathState: { ...sd, player2Correct },
        });
        return { winner: game.participants[0].guestId };
      }

      if (!p1Correct && player2Correct) {
        // Player 2 wins!
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[1].guestId,
          completedAt: now,
          suddenDeathState: { ...sd, player2Correct },
        });
        return { winner: game.participants[1].guestId };
      }

      // Both correct or both wrong! Loop to next pair or evaluate regulation tiebreakers if pairIndex === 3
      if (sd.pairIndex < 3) {
        const nextPairIndex = sd.pairIndex + 1;
        const newGoldenQuestions = await pickGoldenQuestions(ctx);
        const sdDeadline = now + SUDDEN_DEATH_DURATION_MS;

        await ctx.db.patch(game._id, {
          activeTurnPlayerIndex: 0,
          suddenDeathDeadline: sdDeadline,
          suddenDeathState: {
            pairIndex: nextPairIndex,
            questionIds: newGoldenQuestions,
          },
        });

        await ctx.scheduler.runAt(
          sdDeadline,
          internal.bank.mutations.authoritativeExpireSuddenDeath,
          {
            gameId: game._id,
            expectedPairIndex: nextPairIndex,
            expectedTurnPlayerIndex: 0,
          }
        );

        return { loopNextPair: nextPairIndex };
      }

      // Safety Cap reached (3 pairs played without decisive winner).
      // Evaluate regulation match tiebreakers:
      // 1. Total Correct Answers
      const correct0 = game.participants[0].totalCorrectAnswers;
      const correct1 = game.participants[1].totalCorrectAnswers;

      if (correct0 > correct1) {
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[0].guestId,
          completedAt: now,
        });
        return { winner: game.participants[0].guestId, tiebreaker: 'total_correct' };
      }
      if (correct1 > correct0) {
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[1].guestId,
          completedAt: now,
        });
        return { winner: game.participants[1].guestId, tiebreaker: 'total_correct' };
      }

      // 2. Total Time Used (lower is better)
      const time0 = game.participants[0].totalTimeUsedMs;
      const time1 = game.participants[1].totalTimeUsedMs;

      if (time0 < time1) {
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[0].guestId,
          completedAt: now,
        });
        return { winner: game.participants[0].guestId, tiebreaker: 'time_used' };
      }
      if (time1 < time0) {
        await ctx.db.patch(game._id, {
          status: 'completed',
          winnerId: game.participants[1].guestId,
          completedAt: now,
        });
        return { winner: game.participants[1].guestId, tiebreaker: 'time_used' };
      }

      // 3. Complete Draw
      await ctx.db.patch(game._id, {
        status: 'completed',
        isDraw: true,
        completedAt: now,
      });
      return { isDraw: true };
    }
  },
});

/**
 * Shared helper to execute Sudden Death 15s timeout transition.
 */
async function executeSuddenDeathExpire(
  ctx: GenericMutationCtx<DataModel>,
  game: Doc<'bankGames'>,
  expectedPairIndex: number,
  expectedTurnPlayerIndex: number
) {
  if (
    game.status !== 'sudden_death' ||
    !game.suddenDeathState ||
    game.suddenDeathState.pairIndex !== expectedPairIndex ||
    game.activeTurnPlayerIndex !== expectedTurnPlayerIndex
  ) {
    return; // Already resolved
  }

  const now = Date.now();
  const sd = game.suddenDeathState;

  if (expectedTurnPlayerIndex === 0) {
    // Player 0 timed out -> marked incorrect (false), advance to Player 1
    const sdDeadline = now + SUDDEN_DEATH_DURATION_MS;
    await ctx.db.patch(game._id, {
      activeTurnPlayerIndex: 1,
      suddenDeathDeadline: sdDeadline,
      suddenDeathState: {
        ...sd,
        player1Correct: false,
      },
    });

    await ctx.scheduler.runAt(
      sdDeadline,
      internal.bank.mutations.authoritativeExpireSuddenDeath,
      {
        gameId: game._id,
        expectedPairIndex: sd.pairIndex,
        expectedTurnPlayerIndex: 1,
      }
    );
  } else {
    // Player 1 timed out -> evaluate (P1 result vs false)
    const p1Correct = sd.player1Correct ?? false;
    const p2Correct = false;

    if (p1Correct && !p2Correct) {
      await ctx.db.patch(game._id, {
        status: 'completed',
        winnerId: game.participants[0].guestId,
        completedAt: now,
        suddenDeathState: { ...sd, player2Correct: false },
      });
      return;
    }

    // Both false! Loop or tiebreaker
    if (sd.pairIndex < 3) {
      const nextPairIndex = sd.pairIndex + 1;
      const newGoldenQuestions = await pickGoldenQuestions(ctx);
      const sdDeadline = now + SUDDEN_DEATH_DURATION_MS;

      await ctx.db.patch(game._id, {
        activeTurnPlayerIndex: 0,
        suddenDeathDeadline: sdDeadline,
        suddenDeathState: {
          pairIndex: nextPairIndex,
          questionIds: newGoldenQuestions,
        },
      });

      await ctx.scheduler.runAt(
        sdDeadline,
        internal.bank.mutations.authoritativeExpireSuddenDeath,
        {
          gameId: game._id,
          expectedPairIndex: nextPairIndex,
          expectedTurnPlayerIndex: 0,
        }
      );
      return;
    }

    // Regulation tiebreaker
    const correct0 = game.participants[0].totalCorrectAnswers;
    const correct1 = game.participants[1].totalCorrectAnswers;
    if (correct0 !== correct1) {
      await ctx.db.patch(game._id, {
        status: 'completed',
        winnerId: correct0 > correct1 ? game.participants[0].guestId : game.participants[1].guestId,
        completedAt: now,
      });
      return;
    }

    const time0 = game.participants[0].totalTimeUsedMs;
    const time1 = game.participants[1].totalTimeUsedMs;
    if (time0 !== time1) {
      await ctx.db.patch(game._id, {
        status: 'completed',
        winnerId: time0 < time1 ? game.participants[0].guestId : game.participants[1].guestId,
        completedAt: now,
      });
      return;
    }

    await ctx.db.patch(game._id, {
      status: 'completed',
      isDraw: true,
      completedAt: now,
    });
  }
}

/**
 * Authoritative internal mutation for 15s Golden Question timeout.
 */
export const authoritativeExpireSuddenDeath = internalMutation({
  args: {
    gameId: v.id('bankGames'),
    expectedPairIndex: v.number(),
    expectedTurnPlayerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;
    await executeSuddenDeathExpire(ctx, game, args.expectedPairIndex, args.expectedTurnPlayerIndex);
  },
});

/**
 * Client countdown timer expiration handler for Sudden Death Shootout.
 */
export const handleSuddenDeathTimeExpiry = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    expectedPairIndex: v.number(),
    expectedTurnPlayerIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) return { ignored: true, reason: 'game_not_found' };

    const isParticipant = game.participants.some((p) => p.guestId === args.guestId);
    if (!isParticipant) {
      return { ignored: true, reason: 'not_authorized' };
    }

    if (
      game.status !== 'sudden_death' ||
      !game.suddenDeathState ||
      game.suddenDeathState.pairIndex !== args.expectedPairIndex ||
      game.activeTurnPlayerIndex !== args.expectedTurnPlayerIndex
    ) {
      return { ignored: true, reason: 'stale_turn_or_state' };
    }

    const now = Date.now();
    if (game.suddenDeathDeadline && now < game.suddenDeathDeadline - 1500) {
      return { ignored: true, reason: 'deadline_not_reached' };
    }

    await executeSuddenDeathExpire(ctx, game, args.expectedPairIndex, args.expectedTurnPlayerIndex);
    return { resolved: true };
  },
});

/**
 * Unified 1v1 Rematch Initiator.
 * If a rematch room was already created by the opponent, returns that gameId and joins.
 * Otherwise creates a new rematch room and links it to the finished game via rematchGameId.
 */
export const requestBankRematch = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const now = Date.now();

    // 1. If rematch room already exists, join / route to it
    if (game.rematchGameId) {
      const existingRematch = await ctx.db.get(game.rematchGameId);
      if (
        existingRematch &&
        existingRematch.status !== 'completed' &&
        existingRematch.status !== 'abandoned'
      ) {
        // If it's a private duel waiting for the opponent, join it!
        if (
          existingRematch.mode === 'duel_private' &&
          existingRematch.status === 'waiting' &&
          existingRematch.player1Id !== args.guestId &&
          !existingRematch.participants.some((p) => p.guestId === args.guestId)
        ) {
          const guest = await getGuestProfile(ctx, args.guestId);
          const { runs } = await allocateStratifiedQuestions(
            ctx,
            [existingRematch.player1Id, args.guestId],
            true
          );
          const runDeadline = now + RUN_DURATION_MS;
          const updatedParticipants = [
            ...existingRematch.participants,
            {
              guestId: args.guestId,
              name: guest.nickname,
              avatarSeed: guest.avatarSeed,
              totalBankedScore: 0,
              roundScores: [],
              totalCorrectAnswers: 0,
              totalQuestionsAnswered: 0,
              totalTimeUsedMs: 0,
              highestStreak: 0,
              lastPingAt: now,
            },
          ];

          await ctx.db.patch(existingRematch._id, {
            player2Id: args.guestId,
            status: 'in_progress',
            turnQuestionIds: runs[0],
            duelQuestionRuns: runs,
            currentQuestionIndex: 0,
            currentStreak: 0,
            unbankedPoints: 0,
            runStartedAt: now,
            runDeadline,
            participants: updatedParticipants,
          });

          await ctx.scheduler.runAt(
            runDeadline,
            internal.bank.mutations.authoritativeExpireRun,
            {
              gameId: existingRematch._id,
              expectedRound: 1,
              expectedTurnPlayerIndex: 0,
            }
          );
        }
        return { gameId: existingRematch._id };
      }
    }

    // 2. Solo mode rematch: create a new solo game
    if (game.mode === 'solo') {
      const guest = await getGuestProfile(ctx, args.guestId);
      const code = await generateUniqueBankRoomCode(ctx);
      const { runs } = await allocateStratifiedQuestions(ctx, [args.guestId], false);
      const runDeadline = now + RUN_DURATION_MS;

      const newSoloId = await ctx.db.insert('bankGames', {
        code,
        mode: 'solo',
        player1Id: args.guestId,
        status: 'in_progress',
        roundCount: 1,
        currentRound: 1,
        activeTurnPlayerIndex: 0,
        runStartedAt: now,
        runDeadline,
        turnQuestionIds: runs[0],
        currentQuestionIndex: 0,
        currentStreak: 0,
        unbankedPoints: 0,
        participants: [
          {
            guestId: args.guestId,
            name: guest.nickname,
            avatarSeed: guest.avatarSeed,
            totalBankedScore: 0,
            roundScores: [],
            totalCorrectAnswers: 0,
            totalQuestionsAnswered: 0,
            totalTimeUsedMs: 0,
            highestStreak: 0,
            lastPingAt: now,
          },
        ],
        createdAt: now,
      });

      await ctx.scheduler.runAt(
        runDeadline,
        internal.bank.mutations.authoritativeExpireRun,
        {
          gameId: newSoloId,
          expectedRound: 1,
          expectedTurnPlayerIndex: 0,
        }
      );

      await ctx.db.patch(game._id, { rematchGameId: newSoloId });
      return { gameId: newSoloId };
    }

    // 3. 1v1 Duel Rematch: create a private rematch room and record rematchGameId
    const host = await getGuestProfile(ctx, args.guestId);
    const code = await generateUniqueBankRoomCode(ctx);

    const newGameId = await ctx.db.insert('bankGames', {
      code,
      mode: 'duel_private',
      player1Id: args.guestId,
      status: 'waiting',
      roundCount: 2,
      currentRound: 1,
      activeTurnPlayerIndex: 0,
      turnQuestionIds: [],
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      participants: [
        {
          guestId: args.guestId,
          name: host.nickname,
          avatarSeed: host.avatarSeed,
          totalBankedScore: 0,
          roundScores: [],
          totalCorrectAnswers: 0,
          totalQuestionsAnswered: 0,
          totalTimeUsedMs: 0,
          highestStreak: 0,
          lastPingAt: now,
        },
      ],
      createdAt: now,
    });

    await ctx.db.patch(game._id, {
      rematchGameId: newGameId,
      rematchInviterId: args.guestId,
    } as Record<string, unknown>);

    await ctx.db.patch(newGameId, {
      rematchFromGameId: game._id,
      rematchInviterId: args.guestId,
    } as Record<string, unknown>);

    return { gameId: newGameId };
  },
});

/**
 * Invitee accepts Bank Rematch. Allocates questions and starts regulation run.
 */
export const acceptBankRematch = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error('Game not found');

    const rematchGameId = (game as Record<string, unknown>).rematchGameId as Id<'bankGames'> | undefined;
    if (!rematchGameId) throw new Error('No rematch invitation found');

    const rematchGame = await ctx.db.get(rematchGameId);
    if (!rematchGame) throw new Error('Rematch room not found');

    if (rematchGame.status === 'in_progress') {
      return { gameId: rematchGame._id };
    }
    if (rematchGame.status !== 'waiting') {
      throw new Error('Rematch invitation is no longer active');
    }

    const now = Date.now();
    const guest = await getGuestProfile(ctx, args.guestId);
    const { runs } = await allocateStratifiedQuestions(
      ctx,
      [rematchGame.player1Id, args.guestId],
      true
    );
    const runDeadline = now + RUN_DURATION_MS;
    const updatedParticipants = [
      ...rematchGame.participants,
      {
        guestId: args.guestId,
        name: guest.nickname,
        avatarSeed: guest.avatarSeed,
        totalBankedScore: 0,
        roundScores: [],
        totalCorrectAnswers: 0,
        totalQuestionsAnswered: 0,
        totalTimeUsedMs: 0,
        highestStreak: 0,
        lastPingAt: now,
      },
    ];

    await ctx.db.patch(rematchGame._id, {
      player2Id: args.guestId,
      status: 'in_progress',
      turnQuestionIds: runs[0],
      duelQuestionRuns: runs,
      currentQuestionIndex: 0,
      currentStreak: 0,
      unbankedPoints: 0,
      runStartedAt: now,
      runDeadline,
      participants: updatedParticipants,
    });

    await ctx.scheduler.runAt(
      runDeadline,
      internal.bank.mutations.authoritativeExpireRun,
      {
        gameId: rematchGame._id,
        expectedRound: 1,
        expectedTurnPlayerIndex: 0,
      }
    );

    return { gameId: rematchGame._id };
  },
});

/**
 * Invitee declines Bank Rematch. Cancels the waiting room.
 */
export const declineBankRematch = mutation({
  args: {
    gameId: v.id('bankGames'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false };

    const rematchGameId = (game as Record<string, unknown>).rematchGameId as Id<'bankGames'> | undefined;
    if (rematchGameId) {
      const rematchGame = await ctx.db.get(rematchGameId);
      if (rematchGame && rematchGame.status === 'waiting') {
        await ctx.db.patch(rematchGameId, { status: 'abandoned' });
      }
    }
    return { success: true };
  },
});
