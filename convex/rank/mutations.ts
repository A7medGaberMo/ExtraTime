import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id, DataModel } from "../_generated/dataModel";
import { GenericMutationCtx } from "convex/server";
import { scoreRoundSubmission } from "./scoring";
import { allRankSeedQuestions } from "./seedData";
import { validateQuestionBank } from "./validate";

// ── Helpers ──────────────────────────────────────────────────────────

const ROUND_DURATION_MS = 45000; // 45 seconds per round

function generateRankRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomPart = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `RNK-${randomPart}`;
}

async function pickRandomQuestionIds(
  ctx: GenericMutationCtx<DataModel>,
  count: 3 | 5
): Promise<Id<"rankQuestions">[]> {
  const allActive = await ctx.db
    .query("rankQuestions")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .collect();

  if (allActive.length < count) {
    throw new Error(
      `Not enough active questions in bank. Found ${allActive.length}, required ${count}. Please run seedQuestionBank first.`
    );
  }

  // Balanced progressive selection: try to pick diverse scopes and progression
  const shuffled = [...allActive].sort(() => Math.random() - 0.5);

  // Group by difficulty
  const easy = shuffled.filter((q) => q.difficulty === "EASY");
  const medium = shuffled.filter((q) => q.difficulty === "MEDIUM");
  const hard = shuffled.filter((q) => q.difficulty === "HARD" || q.difficulty === "VERY_HARD");

  const selected: typeof allActive = [];

  if (count === 3) {
    // 1 easy/medium, 1 medium, 1 hard
    if (easy.length > 0) selected.push(easy[0]);
    else if (medium.length > 0) selected.push(medium[0]);

    const remainingMedium = medium.filter((q) => !selected.includes(q));
    if (remainingMedium.length > 0) selected.push(remainingMedium[0]);
    else if (shuffled.length > selected.length) selected.push(shuffled.find((q) => !selected.includes(q))!);

    const remainingHard = hard.filter((q) => !selected.includes(q));
    if (remainingHard.length > 0) selected.push(remainingHard[0]);
    else if (shuffled.length > selected.length) selected.push(shuffled.find((q) => !selected.includes(q))!);
  } else {
    // 5 rounds: 1 easy, 2 medium, 2 hard/very hard
    if (easy.length > 0) selected.push(easy[0]);
    const remMed = medium.filter((q) => !selected.includes(q));
    selected.push(...remMed.slice(0, 2));
    const remHard = hard.filter((q) => !selected.includes(q));
    selected.push(...remHard.slice(0, 2));
  }

  // Fallback to fill up if groups were uneven
  while (selected.length < count) {
    const nextQ = shuffled.find((q) => !selected.includes(q));
    if (!nextQ) break;
    selected.push(nextQ);
  }

  return selected.slice(0, count).map((q) => q._id);
}

// ── Mutations ────────────────────────────────────────────────────────

/**
 * Seeds or updates the verified question bank in Convex.
 */
export const seedQuestionBank = mutation({
  args: {},
  handler: async (ctx) => {
    // Validate bank first
    validateQuestionBank(allRankSeedQuestions);

    let inserted = 0;
    let updated = 0;

    for (const q of allRankSeedQuestions) {
      const existing = await ctx.db
        .query("rankQuestions")
        .filter((doc) => doc.eq(doc.field("slug"), q.slug))
        .first();

      const docData = {
        slug: q.slug,
        scopeType: q.scopeType,
        title: q.title,
        subtitle: q.subtitle,
        metricLabel: q.metricLabel,
        direction: q.direction,
        difficulty: q.difficulty,
        answers: q.answers,
        asOfDate: q.asOfDate,
        isActive: q.isActive,
        tags: q.tags,
        createdAt: Date.now(),
      };

      if (existing) {
        await ctx.db.patch(existing._id, docData);
        updated++;
      } else {
        await ctx.db.insert("rankQuestions", docData);
        inserted++;
      }
    }

    return { total: allRankSeedQuestions.length, inserted, updated };
  },
});

/**
 * Creates an instant Solo game session.
 */
export const createSoloGame = mutation({
  args: {
    guestId: v.id("guestUsers"),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest user not found");

    const questionIds = await pickRandomQuestionIds(ctx, args.roundCount);
    const now = Date.now();
    const code = generateRankRoomCode();

    const gameId = await ctx.db.insert("rankGames", {
      code,
      mode: "solo",
      status: "round_active",
      roundCount: args.roundCount,
      currentRoundIndex: 0,
      questionIds,
      roundStartedAt: now,
      roundDeadline: now + ROUND_DURATION_MS,
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          totalScore: 0,
          roundScores: [],
          hasSubmittedCurrentRound: false,
        },
      ],
      roundHistory: [],
      createdAt: now,
    });

    return { gameId, code };
  },
});

/**
 * Creates a private Duel room with a shareable code.
 */
export const createDuelPrivateRoom = mutation({
  args: {
    hostId: v.id("guestUsers"),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    const host = await ctx.db.get(args.hostId);
    if (!host) throw new Error("Host user not found");

    const now = Date.now();
    const code = generateRankRoomCode();

    const gameId = await ctx.db.insert("rankGames", {
      code,
      mode: "duel_private",
      isPublic: false,
      status: "waiting",
      roundCount: args.roundCount,
      currentRoundIndex: 0,
      questionIds: [], // Generated when opponent joins
      participants: [
        {
          guestId: args.hostId,
          name: host.nickname,
          avatarSeed: host.avatarSeed,
          totalScore: 0,
          roundScores: [],
          hasSubmittedCurrentRound: false,
        },
      ],
      roundHistory: [],
      createdAt: now,
    });

    return { gameId, code };
  },
});

/**
 * Joins a private Duel room using a 6-character room code.
 */
export const joinDuelPrivateRoom = mutation({
  args: {
    guestId: v.id("guestUsers"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest user not found");

    const cleanCode = args.code.trim().toUpperCase();
    const game = await ctx.db
      .query("rankGames")
      .withIndex("by_code", (q) => q.eq("code", cleanCode))
      .first();

    if (!game) throw new Error("Room not found. Please check the code.");
    if (game.status !== "waiting") throw new Error("This room is already in progress or completed.");
    if (game.participants.some((p) => p.guestId === args.guestId)) {
      return { gameId: game._id }; // Already in room
    }
    if (game.participants.length >= 2) throw new Error("This room is full.");

    // Pick questions and start game
    const questionIds = await pickRandomQuestionIds(ctx, game.roundCount);
    const now = Date.now();

    const updatedParticipants = [
      ...game.participants,
      {
        guestId: args.guestId,
        name: guest.nickname,
        avatarSeed: guest.avatarSeed,
        totalScore: 0,
        roundScores: [],
        hasSubmittedCurrentRound: false,
      },
    ];

    await ctx.db.patch(game._id, {
      status: "round_active",
      questionIds,
      roundStartedAt: now,
      roundDeadline: now + ROUND_DURATION_MS,
      participants: updatedParticipants,
    });

    return { gameId: game._id };
  },
});

/**
 * Quick Match: Joins an open public queue room or creates a waiting lobby.
 */
export const findOrCreatePublicMatch = mutation({
  args: {
    guestId: v.id("guestUsers"),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    const guest = await ctx.db.get(args.guestId);
    if (!guest) throw new Error("Guest user not found");

    const now = Date.now();

    // Look for waiting public room created in last 5 minutes
    const openRooms = await ctx.db
      .query("rankGames")
      .withIndex("by_public_status", (q) =>
        q.eq("isPublic", true).eq("status", "waiting").eq("mode", "duel_public")
      )
      .collect();

    for (const room of openRooms) {
      const isHost = room.participants[0]?.guestId === args.guestId;
      const isRecent = room.createdAt > now - 5 * 60 * 1000;
      const matchesRound = room.roundCount === args.roundCount;

      if (!isHost && isRecent && matchesRound && room.participants.length === 1) {
        // Match found!
        const questionIds = await pickRandomQuestionIds(ctx, room.roundCount);
        const updatedParticipants = [
          ...room.participants,
          {
            guestId: args.guestId,
            name: guest.nickname,
            avatarSeed: guest.avatarSeed,
            totalScore: 0,
            roundScores: [],
            hasSubmittedCurrentRound: false,
          },
        ];

        await ctx.db.patch(room._id, {
          status: "round_active",
          questionIds,
          roundStartedAt: now,
          roundDeadline: now + ROUND_DURATION_MS,
          participants: updatedParticipants,
        });

        return { gameId: room._id, matched: true };
      }
    }

    // No open room found, create waiting lobby
    const code = generateRankRoomCode();
    const gameId = await ctx.db.insert("rankGames", {
      code,
      mode: "duel_public",
      isPublic: true,
      status: "waiting",
      roundCount: args.roundCount,
      currentRoundIndex: 0,
      questionIds: [],
      participants: [
        {
          guestId: args.guestId,
          name: guest.nickname,
          avatarSeed: guest.avatarSeed,
          totalScore: 0,
          roundScores: [],
          hasSubmittedCurrentRound: false,
        },
      ],
      roundHistory: [],
      createdAt: now,
    });

    return { gameId, matched: false };
  },
});

/**
 * Submits a ranking for the current round and computes authoritative score.
 */
export const submitRound = mutation({
  args: {
    gameId: v.id("rankGames"),
    guestId: v.id("guestUsers"),
    submittedOrder: v.array(v.string()), // 5 answerKeys
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "round_active") throw new Error("Round is not active for submission");

    const pIndex = game.participants.findIndex((p) => p.guestId === args.guestId);
    if (pIndex === -1) throw new Error("Player not in this game");

    const participant = game.participants[pIndex];
    if (participant.hasSubmittedCurrentRound) {
      return { success: true, alreadySubmitted: true };
    }

    const currentQId = game.questionIds[game.currentRoundIndex];
    const rawQuestion = await ctx.db.get(currentQId);
    if (!rawQuestion) throw new Error("Question not found");

    // Strict validation of submitted ranking
    if (!Array.isArray(args.submittedOrder) || args.submittedOrder.length !== 5) {
      throw new Error("Invalid submission: Exactly 5 items must be ranked.");
    }
    const uniqueKeys = new Set(args.submittedOrder);
    if (uniqueKeys.size !== 5) {
      throw new Error("Invalid submission: Duplicate answer keys detected.");
    }
    const validKeys = new Set(rawQuestion.answers.map((a) => a.answerKey));
    for (const key of args.submittedOrder) {
      if (!validKeys.has(key)) {
        throw new Error(`Invalid submission: Unknown answer key '${key}' for this question.`);
      }
    }

    const now = Date.now();
    const deadline = game.roundDeadline ?? now;
    const secondsRemaining = Math.max(0, Math.floor((deadline - now) / 1000));

    // Calculate authoritative score
    const scoreResult = scoreRoundSubmission(
      args.submittedOrder,
      rawQuestion.answers,
      rawQuestion.direction,
      secondsRemaining
    );

    // Update participant
    const updatedRoundScores = [...participant.roundScores, scoreResult.roundScore];
    const updatedTotalScore = participant.totalScore + scoreResult.roundScore;

    const updatedParticipant = {
      ...participant,
      hasSubmittedCurrentRound: true,
      submittedOrder: args.submittedOrder,
      submittedAt: now,
      secondsRemainingOnSubmit: secondsRemaining,
      roundScores: updatedRoundScores,
      totalScore: updatedTotalScore,
    };

    const newParticipants = [...game.participants];
    newParticipants[pIndex] = updatedParticipant;

    // Check if ALL participants in this game have submitted
    const allSubmitted = newParticipants.every((p) => p.hasSubmittedCurrentRound);

    if (allSubmitted) {
      // Build canonical correct order
      const sortedCanonical = [...rawQuestion.answers].sort((a, b) =>
        rawQuestion.direction === "desc" ? b.value - a.value : a.value - b.value
      );
      const resolvedOrder = sortedCanonical.map((a) => a.answerKey);

      // Build round history results for all players
      const roundSubmissionResults = newParticipants.map((p) => {
        const pScore = scoreRoundSubmission(
          p.submittedOrder || resolvedOrder,
          rawQuestion.answers,
          rawQuestion.direction,
          p.secondsRemainingOnSubmit ?? 0
        );

        return {
          guestId: p.guestId,
          submittedOrder: p.submittedOrder || [],
          roundScore: pScore.roundScore,
          secondsRemaining: p.secondsRemainingOnSubmit ?? 0,
          cardDeltas: pScore.cardDeltas,
        };
      });

      const newHistoryEntry = {
        roundIndex: game.currentRoundIndex,
        questionId: rawQuestion._id,
        resolvedOrder,
        results: roundSubmissionResults,
      };

      const updatedHistory = [...game.roundHistory, newHistoryEntry];

      await ctx.db.patch(game._id, {
        status: "round_reveal",
        participants: newParticipants,
        roundHistory: updatedHistory,
      });
    } else {
      // Still waiting for other player in duel
      await ctx.db.patch(game._id, {
        participants: newParticipants,
      });
    }

    return {
      success: true,
      roundScore: scoreResult.roundScore,
      allSubmitted,
    };
  },
});

/**
 * Advances from reveal to next round or finishes game.
 */
export const advanceRound = mutation({
  args: {
    gameId: v.id("rankGames"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "round_reveal") throw new Error("Game is not in reveal state");

    const nextRoundIndex = game.currentRoundIndex + 1;
    const isGameOver = nextRoundIndex >= game.roundCount;
    const now = Date.now();

    if (isGameOver) {
      // Determine winner with authoritative cumulative tiebreaker from roundHistory
      let winnerId: Id<"guestUsers"> | undefined = undefined;
      if (game.participants.length > 1) {
        const participantStats = game.participants.map((p) => {
          let totalTiebreakTime = 0;
          for (const round of game.roundHistory) {
            const r = round.results.find((res) => res.guestId === p.guestId);
            if (r) {
              totalTiebreakTime += r.secondsRemaining ?? 0;
            }
          }
          return {
            guestId: p.guestId,
            totalScore: p.totalScore,
            totalTiebreakTime,
          };
        });

        participantStats.sort((a, b) => {
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
          }
          // Tiebreaker: total seconds remaining on submit across all rounds
          return b.totalTiebreakTime - a.totalTiebreakTime;
        });

        // Determine if there is a distinct winner
        if (
          participantStats[0].totalScore !== participantStats[1]?.totalScore ||
          participantStats[0].totalTiebreakTime !== participantStats[1]?.totalTiebreakTime
        ) {
          winnerId = participantStats[0].guestId;
        }
      }

      await ctx.db.patch(game._id, {
        status: "completed",
        winnerId,
        completedAt: now,
      });

      return { status: "completed", winnerId };
    } else {
      // Reset participant submit flags for next round
      const resetParticipants = game.participants.map((p) => ({
        ...p,
        hasSubmittedCurrentRound: false,
        submittedOrder: undefined,
        submittedAt: undefined,
        secondsRemainingOnSubmit: undefined,
      }));

      await ctx.db.patch(game._id, {
        status: "round_active",
        currentRoundIndex: nextRoundIndex,
        roundStartedAt: now,
        roundDeadline: now + ROUND_DURATION_MS,
        participants: resetParticipants,
      });

      return { status: "round_active", currentRoundIndex: nextRoundIndex };
    }
  },
});
