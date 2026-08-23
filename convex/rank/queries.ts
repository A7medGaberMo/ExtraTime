import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Seeded deterministic shuffle helper to guarantee all players in a match see the exact
 * same scrambled initial card order, without revealing the correct rank order.
 */
function seededShuffle<T>(array: T[], seedStr: string): T[] {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }

  const pseudoRandom = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash) / 233280;
  };

  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const getGameState = query({
  args: {
    gameId: v.id("rankGames"),
    guestId: v.id("guestUsers"),
    locale: v.optional(v.union(v.literal("en"), v.literal("ar"))),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    const locale = args.locale ?? "en";
    const currentQId = game.questionIds[game.currentRoundIndex];
    const rawQuestion = currentQId ? await ctx.db.get(currentQId) : null;

    // Check if user is in this game
    const player = game.participants.find((p) => p.guestId === args.guestId);
    const isPlayer = !!player;

    const isHost = game.participants[0]?.guestId === args.guestId;

    // Helper to sanitize participant for client view
    const formatParticipant = (p: typeof game.participants[0]) => {
      const isSelf = p.guestId === args.guestId;
      const isRevealOrDone = game.status === "round_reveal" || game.status === "completed";
      return {
        guestId: p.guestId,
        name: p.name,
        avatarSeed: p.avatarSeed,
        totalScore: p.totalScore,
        roundScores: p.roundScores,
        hasSubmittedCurrentRound: p.hasSubmittedCurrentRound,
        submittedOrder: isSelf || isRevealOrDone ? p.submittedOrder : undefined,
        submittedAt: isSelf || isRevealOrDone ? p.submittedAt : undefined,
        secondsRemainingOnSubmit: isSelf || isRevealOrDone ? p.secondsRemainingOnSubmit : undefined,
        isDisconnected: p.isDisconnected,
      };
    };

    const participants = game.participants.map(formatParticipant);

    // ── 1. WAITING LOBBY ──────────────────────────────────────────────
    if (game.status === "waiting") {
      return {
        _id: game._id,
        code: game.code,
        mode: game.mode,
        isPublic: game.isPublic ?? false,
        status: game.status,
        roundCount: game.roundCount,
        currentRoundIndex: 0,
        roundStartedAt: undefined,
        roundDeadline: undefined,
        question: null,
        participants,
        currentRoundResult: null,
        roundHistory: [],
        winnerId: undefined,
        completedAt: undefined,
        isHost,
        isPlayer,
      };
    }

    // ── 2. ACTIVE ROUND (Cheat-Proof Sanitized DTO) ───────────────────
    if (game.status === "round_active" && rawQuestion) {
      // Deterministically scramble cards using game code, round index, and question slug
      const roundSeed = `${game.code}_round${game.currentRoundIndex}_${rawQuestion.slug}`;
      const scrambledCards = seededShuffle(rawQuestion.answers, roundSeed);

      const sanitizedAnswers = scrambledCards.map((ans) => {
        let cleanSubText = ans.subText ? ans.subText[locale] : undefined;
        if (cleanSubText) {
          // Defense-in-depth: strip any leading numbers or naked stat counts during active guessing
          cleanSubText = cleanSubText.replace(/^\d+.*$/g, '').trim() || undefined;
        }

        return {
          answerKey: ans.answerKey,
          name: ans.name[locale],
          subText: cleanSubText,
          media: ans.media,
          // Value, valueLabel, and correctRank are STRIPPED
          value: undefined,
          valueLabel: undefined,
          correctRank: undefined,
        };
      });

      return {

        _id: game._id,
        code: game.code,
        mode: game.mode,
        isPublic: game.isPublic ?? false,
        status: game.status,
        roundCount: game.roundCount,
        currentRoundIndex: game.currentRoundIndex,
        roundStartedAt: game.roundStartedAt,
        roundDeadline: game.roundDeadline,
        question: {
          slug: rawQuestion.slug,
          scopeType: rawQuestion.scopeType,
          title: rawQuestion.title[locale],
          subtitle: rawQuestion.subtitle ? rawQuestion.subtitle[locale] : undefined,
          metricLabel: rawQuestion.metricLabel[locale],
          direction: rawQuestion.direction,
          difficulty: rawQuestion.difficulty,
          asOfDate: rawQuestion.asOfDate,
          tags: rawQuestion.tags,
          answers: sanitizedAnswers,
        },
        participants,
        currentRoundResult: null,
        roundHistory: game.roundHistory,
        winnerId: game.winnerId,
        completedAt: game.completedAt,
        isHost,
        isPlayer,
      };
    }

    // ── 3. REVEAL & COMPLETED PHASES (Full Details) ───────────────────
    const historyEntry = game.roundHistory[game.currentRoundIndex] ?? null;
    let localizedQuestion = null;

    if (rawQuestion) {
      localizedQuestion = {
        slug: rawQuestion.slug,
        scopeType: rawQuestion.scopeType,
        title: rawQuestion.title[locale],
        subtitle: rawQuestion.subtitle ? rawQuestion.subtitle[locale] : undefined,
        metricLabel: rawQuestion.metricLabel[locale],
        direction: rawQuestion.direction,
        difficulty: rawQuestion.difficulty,
        asOfDate: rawQuestion.asOfDate,
        tags: rawQuestion.tags,
        answers: rawQuestion.answers.map((ans) => ({
          answerKey: ans.answerKey,
          name: ans.name[locale],
          subText: ans.subText ? ans.subText[locale] : undefined,
          media: ans.media,
          value: ans.value,
          valueLabel: ans.valueLabel[locale],
          correctRank: ans.correctRank,
        })),
      };
    }

    return {
      _id: game._id,
      code: game.code,
      mode: game.mode,
      isPublic: game.isPublic ?? false,
      status: game.status,
      roundCount: game.roundCount,
      currentRoundIndex: game.currentRoundIndex,
      roundStartedAt: game.roundStartedAt,
      roundDeadline: game.roundDeadline,
      question: localizedQuestion,
      participants,
      currentRoundResult: historyEntry,
      roundHistory: game.roundHistory,
      winnerId: game.winnerId,
      completedAt: game.completedAt,
      isHost,
      isPlayer,
    };
  },
});

export const getPublicQueueSummary = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const waitingRooms = await ctx.db
      .query("rankGames")
      .withIndex("by_public_status", (q) =>
        q.eq("isPublic", true).eq("status", "waiting").eq("mode", "duel_public")
      )
      .collect();

    const freshRooms = waitingRooms.filter((r) => r.createdAt > now - 3 * 60 * 1000);

    return {
      waitingCount: freshRooms.length,
      waiting3: freshRooms.filter((r) => r.roundCount === 3).length,
      waiting5: freshRooms.filter((r) => r.roundCount === 5).length,
    };
  },
});

export const getBankStats = query({
  args: {},
  handler: async (ctx) => {
    const questions = await ctx.db
      .query("rankQuestions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return {
      totalQuestions: questions.length,
      byScope: {
        ALL_TIME: questions.filter((q) => q.scopeType === "ALL_TIME").length,
        PER_SEASON: questions.filter((q) => q.scopeType === "PER_SEASON").length,
        PER_CLUB: questions.filter((q) => q.scopeType === "PER_CLUB").length,
        PER_COMPETITION: questions.filter((q) => q.scopeType === "PER_COMPETITION").length,
        PLAYER_STINTS: questions.filter((q) => q.scopeType === "PLAYER_STINTS").length,
        TRANSFERS_MARKET: questions.filter((q) => q.scopeType === "TRANSFERS_MARKET").length,
      },
    };
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const cleanCode = args.code.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
    const rawCode = args.code.trim().toUpperCase();
    let game = await ctx.db
      .query("rankGames")
      .withIndex("by_code", (q) => q.eq("code", cleanCode))
      .first();
    if (!game && rawCode !== cleanCode) {
      game = await ctx.db
        .query("rankGames")
        .withIndex("by_code", (q) => q.eq("code", rawCode))
        .first();
    }

    if (!game) return null;
    return {
      _id: game._id,
      code: game.code,
      status: game.status,
      mode: game.mode,
      roundCount: game.roundCount,
      hostName: game.participants[0]?.name ?? "Host",
      participantsCount: game.participants.length,
      isFull: game.participants.length >= 2,
    };
  },
});
