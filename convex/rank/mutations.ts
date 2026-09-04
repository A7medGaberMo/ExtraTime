import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id, DataModel, Doc } from "../_generated/dataModel";
import { GenericMutationCtx } from "convex/server";
import { scoreRoundSubmission } from "./scoring";
import { allRankSeedQuestions } from "./seedData";
import { validateQuestionBank } from "./validate";
import { verifyGuestSession } from "../lib/auth";

// ── Helpers ──────────────────────────────────────────────────────────



const ROUND_DURATION_MS = 45000; // 45 seconds per round
const FALLBACK_GUEST_NAME = "Guest Manager";

function generateRankRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function generateUniqueRankRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRankRoomCode();
    const existing = await ctx.db
      .query("rankGames")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique rank room code");
}

function normalizeRankRoomCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6);
}

/**
 * Fisher-Yates uniform shuffle helper.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Deterministic pseudo-random shuffle to replicate canonical round card order.
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

function resolveRoundToReveal(
  rawQuestion: Doc<"rankQuestions">,
  participants: Doc<"rankGames">["participants"],
  roundIndex: number,
  existingHistory: Doc<"rankGames">["roundHistory"]
) {
  const sortedCanonical = [...rawQuestion.answers].sort((a, b) =>
    rawQuestion.direction === "desc" ? b.value - a.value : a.value - b.value
  );
  const resolvedOrder = sortedCanonical.map((a) => a.answerKey);

  const roundSubmissionResults = participants.map((p) => {
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
    roundIndex,
    questionId: rawQuestion._id,
    resolvedOrder,
    results: roundSubmissionResults,
  };

  return {
    resolvedOrder,
    updatedHistory: [...existingHistory, newHistoryEntry],
  };
}

/**
 * Classifies a question into a high-level thematic domain for maximum variety per game.
 */
function getThematicDomain(q: { tags?: string[]; scopeType?: string }): string {
  const tags = new Set(q.tags || []);
  if (
    tags.has("world-cup") ||
    tags.has("world-cup-2022") ||
    tags.has("euro") ||
    tags.has("copa-america") ||
    tags.has("afcon") ||
    tags.has("asian-cup") ||
    tags.has("national-teams") ||
    tags.has("olympics") ||
    tags.has("concacaf")
  ) {
    return "internationals";
  }

  if (
    tags.has("ucl") ||
    tags.has("champions-league") ||
    tags.has("europa-league") ||
    tags.has("uel") ||
    tags.has("uefa-super-cup") ||
    tags.has("club-world-cup") ||
    tags.has("treble")
  ) {
    return "european_and_continental";
  }

  if (
    tags.has("premier-league") ||
    tags.has("la-liga") ||
    tags.has("serie-a") ||
    tags.has("bundesliga") ||
    tags.has("ligue-1") ||
    tags.has("el-clasico") ||
    tags.has("manchester-derby") ||
    tags.has("north-london-derby") ||
    tags.has("derby-madonnina") ||
    tags.has("merseyside-derby") ||
    q.scopeType === "PER_CLUB"
  ) {
    return "domestic_clubs_and_leagues";
  }

  if (
    tags.has("transfers") ||
    tags.has("fees") ||
    tags.has("market") ||
    tags.has("market-value") ||
    q.scopeType === "TRANSFERS_MARKET" ||
    q.scopeType === "PER_SEASON"
  ) {
    return "market_and_seasons";
  }

  return "player_legends_and_milestones";
}

async function pickRandomQuestionIds(
  ctx: GenericMutationCtx<DataModel>,
  count: 3 | 5,
  participantGuestIds?: Id<"guestUsers">[]
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

  // 1. Gather recent question IDs to prevent duplicate/repeated questions for participants
  const recentQuestionIds = new Set<Id<"rankQuestions">>();
  if (participantGuestIds && participantGuestIds.length > 0) {
    const guestIdSet = new Set(participantGuestIds);
    // Take the 30 most recent rank games
    const recentGames = await ctx.db.query("rankGames").order("desc").take(30);

    for (const g of recentGames) {
      const involvesPlayer = g.participants.some((p) => guestIdSet.has(p.guestId));
      if (involvesPlayer && g.questionIds) {
        for (const qId of g.questionIds) {
          recentQuestionIds.add(qId);
        }
      }
    }
  }

  // 2. Candidate pool: prioritize fresh (unplayed) questions
  let candidatePool = allActive.filter((q) => !recentQuestionIds.has(q._id));
  if (candidatePool.length < count) {
    // If unplayed questions run low, blend unplayed first with all active
    candidatePool = allActive;
  }

  // 3. Two-Tier Category Shuffle:
  // Group candidates by thematic domain
  const domainMap = new Map<string, typeof allActive>();
  for (const q of candidatePool) {
    const domain = getThematicDomain(q);
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain)!.push(q);
  }

  // Shuffle questions within each category domain
  for (const [domain, questions] of domainMap.entries()) {
    domainMap.set(domain, shuffleArray(questions));
  }

  // Shuffle the order of categories
  const domainKeys = shuffleArray(Array.from(domainMap.keys()));

  const selected: typeof allActive = [];
  const selectedSet = new Set<string>();

  // Pass 1: Pick 1 question from distinct shuffled categories
  for (const domain of domainKeys) {
    if (selected.length >= count) break;
    const bucket = domainMap.get(domain)!;
    const item = bucket.find((q) => !selectedSet.has(q._id));
    if (item) {
      selected.push(item);
      selectedSet.add(item._id);
    }
  }

  // Pass 2: If more questions are needed, fill from remaining candidate pool
  if (selected.length < count) {
    const remainingShuffled = shuffleArray(candidatePool.filter((q) => !selectedSet.has(q._id)));
    for (const q of remainingShuffled) {
      if (selected.length >= count) break;
      selected.push(q);
      selectedSet.add(q._id);
    }
  }

  // Pass 3: Final round order shuffle so rounds are dynamic
  const finalShuffledOrder = shuffleArray(selected);

  return finalShuffledOrder.map((q) => q._id);
}

async function getGuestProfile(ctx: GenericMutationCtx<DataModel>, guestId: Id<"guestUsers">) {
  const guest = await ctx.db.get(guestId);
  return {
    nickname: guest?.nickname ?? FALLBACK_GUEST_NAME,
    avatarSeed: guest?.avatarSeed ?? guestId,
  };
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

    const allDbQuestions = await ctx.db.query("rankQuestions").collect();
    const dbQuestionMap = new Map(allDbQuestions.map((q) => [q.slug, q]));

    let inserted = 0;
    let updated = 0;

    for (const q of allRankSeedQuestions) {
      const existing = dbQuestionMap.get(q.slug);

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

    // Clean up questions removed from seed bank
    const validSlugs = new Set(allRankSeedQuestions.map((q) => q.slug));
    let deleted = 0;
    for (const dbQ of allDbQuestions) {
      if (!validSlugs.has(dbQ.slug)) {
        await ctx.db.delete(dbQ._id);
        deleted++;
      }
    }

    return { total: allRankSeedQuestions.length, inserted, updated, deleted };
  },
});

/**
 * Creates an instant Solo game session.
 */
export const createSoloGame = mutation({
  args: {
    guestId: v.id("guestUsers"),
    sessionToken: v.optional(v.string()),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);

    const questionIds = await pickRandomQuestionIds(ctx, args.roundCount, [args.guestId]);
    const now = Date.now();
    const code = await generateUniqueRankRoomCode(ctx);

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
    sessionToken: v.optional(v.string()),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);
    const host = await getGuestProfile(ctx, args.hostId);

    const now = Date.now();
    const code = await generateUniqueRankRoomCode(ctx);

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
    sessionToken: v.optional(v.string()),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);

    const cleanCode = normalizeRankRoomCode(args.code);
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

    if (!game) throw new Error("Room not found. Please check the code.");
    if (game.participants.some((p) => p.guestId === args.guestId)) {
      return { gameId: game._id }; // Already in room - allow seamless rejoin
    }
    if (game.status !== "waiting") throw new Error("This room is already in progress or completed.");
    if (game.participants.length >= 2) throw new Error("This room is full.");


    // Pick non-repeated questions for both players and start game
    const hostGuestId = game.participants[0]?.guestId;
    const questionIds = await pickRandomQuestionIds(
      ctx,
      game.roundCount,
      hostGuestId ? [hostGuestId, args.guestId] : [args.guestId]
    );
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
    sessionToken: v.optional(v.string()),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const guest = await getGuestProfile(ctx, args.guestId);
    const now = Date.now();

    // Look for waiting public room created in last 3 minutes
    const openRooms = await ctx.db
      .query("rankGames")
      .withIndex("by_public_status", (q) =>
        q.eq("isPublic", true).eq("status", "waiting").eq("mode", "duel_public")
      )
      .take(50);

    // Prevent duplicate queue rooms by same host
    const existingHostGame = openRooms.find(
      (r) => r.participants[0]?.guestId === args.guestId && r.roundCount === args.roundCount,
    );
    if (existingHostGame) {
      return { gameId: existingHostGame._id, matched: false };
    }

    for (const room of openRooms) {
      if (room.createdAt <= now - 3 * 60 * 1000) {
        // Auto-expire stale waiting rank room after 3 minutes with no rival
        await ctx.db.patch(room._id, { status: "completed" });
        continue;
      }

      const isHost = room.participants[0]?.guestId === args.guestId;
      const isRecent = room.createdAt > now - 3 * 60 * 1000;
      const matchesRound = room.roundCount === args.roundCount;

      if (!isHost && isRecent && matchesRound && room.participants.length === 1) {
        // Match found! Pick non-repeated questions
        const hostGuestId = room.participants[0]?.guestId;
        const questionIds = await pickRandomQuestionIds(
          ctx,
          room.roundCount,
          hostGuestId ? [hostGuestId, args.guestId] : [args.guestId]
        );
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
    const code = await generateUniqueRankRoomCode(ctx);
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
    sessionToken: v.optional(v.string()),
    submittedOrder: v.array(v.string()), // 5 answerKeys
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
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

    const isDeadlinePassed = deadline > 0 && now >= deadline - 1000;
    let finalParticipants = newParticipants;

    // If deadline passed, auto-complete any remaining unsubmitted participant so the round resolves
    if (isDeadlinePassed && !newParticipants.every((p) => p.hasSubmittedCurrentRound)) {
      const roundSeed = `${game.code}_round${game.currentRoundIndex}_${rawQuestion.slug}`;
      const initialScrambled = seededShuffle(rawQuestion.answers, roundSeed).map((a) => a.answerKey);

      finalParticipants = newParticipants.map((p) => {
        if (p.hasSubmittedCurrentRound) return p;
        const unrankedScore = scoreRoundSubmission(
          initialScrambled,
          rawQuestion.answers,
          rawQuestion.direction,
          0
        );
        return {
          ...p,
          hasSubmittedCurrentRound: true,
          submittedOrder: initialScrambled,
          submittedAt: now,
          secondsRemainingOnSubmit: 0,
          roundScores: [...p.roundScores, unrankedScore.roundScore],
          totalScore: p.totalScore + unrankedScore.roundScore,
        };
      });
    }

    // Check if ALL participants in this game have submitted
    const allSubmitted = finalParticipants.every((p) => p.hasSubmittedCurrentRound);

    if (allSubmitted) {
      const { updatedHistory } = resolveRoundToReveal(
        rawQuestion,
        finalParticipants,
        game.currentRoundIndex,
        game.roundHistory
      );

      await ctx.db.patch(game._id, {
        status: "round_reveal",
        participants: finalParticipants,
        roundHistory: updatedHistory,
      });
    } else {
      // Still waiting for other player in duel
      await ctx.db.patch(game._id, {
        participants: finalParticipants,
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
 * Authoritatively resolves an expired active round if the 45s round deadline
 * has elapsed. Any participant who hasn't submitted receives the default unranked
 * card order with 0 seconds remaining so the match never hangs or gets stuck.
 */
export const resolveExpiredRound = mutation({
  args: {
    gameId: v.id("rankGames"),
    guestId: v.id("guestUsers"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "round_active") {
      return { status: game.status, alreadyResolved: true };
    }
    const isParticipant = game.participants.some((p) => p.guestId === args.guestId);
    if (!isParticipant) throw new Error("Player not in this game");

    const now = Date.now();
    const deadline = game.roundDeadline ?? 0;
    const expired = deadline > 0 && now >= deadline - 1500;
    const allSubmitted = game.participants.every((p) => p.hasSubmittedCurrentRound);

    if (!expired && !allSubmitted) {
      return { resolved: false, reason: "waiting_for_timer_or_bids" };
    }

    const currentQId = game.questionIds[game.currentRoundIndex];
    const rawQuestion = await ctx.db.get(currentQId);
    if (!rawQuestion) throw new Error("Question not found");

    const roundSeed = `${game.code}_round${game.currentRoundIndex}_${rawQuestion.slug}`;
    const initialScrambled = seededShuffle(rawQuestion.answers, roundSeed).map((a) => a.answerKey);

    // Auto-complete any unsubmitted participant
    const finalParticipants = game.participants.map((p) => {
      if (p.hasSubmittedCurrentRound) return p;
      const unrankedScore = scoreRoundSubmission(
        initialScrambled,
        rawQuestion.answers,
        rawQuestion.direction,
        0
      );
      return {
        ...p,
        hasSubmittedCurrentRound: true,
        submittedOrder: initialScrambled,
        submittedAt: now,
        secondsRemainingOnSubmit: 0,
        roundScores: [...p.roundScores, unrankedScore.roundScore],
        totalScore: p.totalScore + unrankedScore.roundScore,
      };
    });

    const { updatedHistory } = resolveRoundToReveal(
      rawQuestion,
      finalParticipants,
      game.currentRoundIndex,
      game.roundHistory
    );

    await ctx.db.patch(game._id, {
      status: "round_reveal",
      participants: finalParticipants,
      roundHistory: updatedHistory,
    });

    return { resolved: true, status: "round_reveal" };
  },
});

/**
 * Gracefully abandons or forfeits a rank game.
 * If in waiting lobby -> room status becomes 'abandoned'.
 * If in active or reveal -> crowns opponent as winner and completes match.
 */
export const abandonGame = mutation({
  args: {
    gameId: v.id("rankGames"),
    guestId: v.id("guestUsers"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    const isParticipant = game.participants.some((p) => p.guestId === args.guestId);
    if (!isParticipant) throw new Error("Player not in this game");

    if (game.status === "completed" || game.status === "abandoned") {
      return { status: game.status };
    }

    if (game.status === "waiting") {
      await ctx.db.patch(game._id, {
        status: "abandoned",
        completedAt: Date.now(),
      });
      return { status: "abandoned" };
    }

    // Active or Reveal in duel -> opponent wins by forfeit
    const opponent = game.participants.find((p) => p.guestId !== args.guestId);
    const winnerId = opponent ? opponent.guestId : undefined;

    await ctx.db.patch(game._id, {
      status: "completed",
      winnerId,
      completedAt: Date.now(),
    });

    return { status: "completed", winnerId };
  },
});

/**
 * Advances from reveal to next round or finishes game.
 */
export const advanceRound = mutation({
  args: {
    gameId: v.id("rankGames"),
    guestId: v.id("guestUsers"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (!game.participants.some((p) => p.guestId === args.guestId)) {
      throw new Error("Player not in this game");
    }
    if (game.status !== "round_reveal") {
      return { status: game.status, alreadyAdvanced: true };
    }

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
