import { GenericMutationCtx } from 'convex/server';
import { DataModel, Id } from '../_generated/dataModel';

/**
 * Idempotently scores a completed Snipe league match and updates standings for both participants.
 */
export async function scoreLeagueSnipeMatch(
  ctx: GenericMutationCtx<DataModel>,
  args: {
    roomId: Id<'rooms'>;
    hostScore: number;
    guestScore: number;
    hostUserId?: Id<'users'>;
    guestUserId?: Id<'users'>;
    winnerUserId?: Id<'users'>;
    isDraw?: boolean;
  },
) {
  const leagueMatch = await ctx.db
    .query('leagueMatches')
    .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
    .first();

  if (!leagueMatch) return;
  if (leagueMatch.scoredAt) return; // Already scored — strict idempotency guard

  const hostUserId = args.hostUserId || leagueMatch.hostUserId;
  const guestUserId = args.guestUserId || leagueMatch.guestUserId;

  if (!hostUserId || !guestUserId) return;

  const hostWon = args.winnerUserId ? args.winnerUserId === hostUserId : args.hostScore > args.guestScore;
  const guestWon = args.winnerUserId ? args.winnerUserId === guestUserId : args.guestScore > args.hostScore;
  const isDraw = args.isDraw !== undefined ? args.isDraw : (!hostWon && !guestWon);
  const winnerUserId = hostWon ? hostUserId : guestWon ? guestUserId : undefined;


  const [hostMember, guestMember] = await Promise.all([
    ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', leagueMatch.leagueId).eq('userId', hostUserId))
      .first(),
    ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', leagueMatch.leagueId).eq('userId', guestUserId))
      .first(),
  ]);

  if (hostMember) {
    const hostPointsEarned = hostWon ? 3 : isDraw ? 1 : 0;
    const newGoalsFor = hostMember.snipeStats.goalsFor + args.hostScore;
    const newGoalsAgainst = hostMember.snipeStats.goalsAgainst + args.guestScore;
    const newSnipePoints = hostMember.snipeStats.points + hostPointsEarned;

    await ctx.db.patch(hostMember._id, {
      snipeStats: {
        played: hostMember.snipeStats.played + 1,
        won: hostMember.snipeStats.won + (hostWon ? 1 : 0),
        drawn: hostMember.snipeStats.drawn + (isDraw ? 1 : 0),
        lost: hostMember.snipeStats.lost + (guestWon ? 1 : 0),
        goalsFor: newGoalsFor,
        goalsAgainst: newGoalsAgainst,
        goalDiff: newGoalsFor - newGoalsAgainst,
        points: newSnipePoints,
      },
      combinedPoints: newSnipePoints + hostMember.rankStats.points,
    });
  }

  if (guestMember) {
    const guestPointsEarned = guestWon ? 3 : isDraw ? 1 : 0;
    const newGoalsFor = guestMember.snipeStats.goalsFor + args.guestScore;
    const newGoalsAgainst = guestMember.snipeStats.goalsAgainst + args.hostScore;
    const newSnipePoints = guestMember.snipeStats.points + guestPointsEarned;

    await ctx.db.patch(guestMember._id, {
      snipeStats: {
        played: guestMember.snipeStats.played + 1,
        won: guestMember.snipeStats.won + (guestWon ? 1 : 0),
        drawn: guestMember.snipeStats.drawn + (isDraw ? 1 : 0),
        lost: guestMember.snipeStats.lost + (hostWon ? 1 : 0),
        goalsFor: newGoalsFor,
        goalsAgainst: newGoalsAgainst,
        goalDiff: newGoalsFor - newGoalsAgainst,
        points: newSnipePoints,
      },
      combinedPoints: newSnipePoints + guestMember.rankStats.points,
    });
  }

  const now = Date.now();
  await ctx.db.patch(leagueMatch._id, {
    guestUserId,
    hostScore: args.hostScore,
    guestScore: args.guestScore,
    winnerUserId,
    isDraw,
    status: 'completed',
    scoredAt: now,
  });
}

/**
 * Idempotently scores a completed Rank duel league match and updates standings for both participants.
 */
export async function scoreLeagueRankDuel(
  ctx: GenericMutationCtx<DataModel>,
  args: {
    rankGameId: Id<'rankGames'>;
    hostScore: number;
    guestScore: number;
    hostUserId?: Id<'users'>;
    guestUserId?: Id<'users'>;
  },
) {
  const leagueMatch = await ctx.db
    .query('leagueMatches')
    .withIndex('by_rankGame', (q) => q.eq('rankGameId', args.rankGameId))
    .first();

  if (!leagueMatch) return;
  if (leagueMatch.scoredAt) return; // Strict idempotency guard

  const hostUserId = args.hostUserId || leagueMatch.hostUserId;
  const guestUserId = args.guestUserId || leagueMatch.guestUserId;

  if (!hostUserId || !guestUserId) return;

  const isDraw = args.hostScore === args.guestScore;
  const hostWon = args.hostScore > args.guestScore;
  const guestWon = args.guestScore > args.hostScore;
  const winnerUserId = hostWon ? hostUserId : guestWon ? guestUserId : undefined;

  const [hostMember, guestMember] = await Promise.all([
    ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', leagueMatch.leagueId).eq('userId', hostUserId))
      .first(),
    ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', leagueMatch.leagueId).eq('userId', guestUserId))
      .first(),
  ]);

  if (hostMember) {
    const hostPointsEarned = hostWon ? 3 : isDraw ? 1 : 0;
    const newScoreFor = hostMember.rankStats.scoreFor + args.hostScore;
    const newScoreAgainst = hostMember.rankStats.scoreAgainst + args.guestScore;
    const newTotalScore = hostMember.rankStats.totalScore + args.hostScore;
    const newRankPoints = hostMember.rankStats.points + hostPointsEarned;

    await ctx.db.patch(hostMember._id, {
      rankStats: {
        played: hostMember.rankStats.played + 1,
        won: hostMember.rankStats.won + (hostWon ? 1 : 0),
        drawn: hostMember.rankStats.drawn + (isDraw ? 1 : 0),
        lost: hostMember.rankStats.lost + (guestWon ? 1 : 0),
        scoreFor: newScoreFor,
        scoreAgainst: newScoreAgainst,
        scoreDiff: newScoreFor - newScoreAgainst,
        totalScore: newTotalScore,
        points: newRankPoints,
      },
      combinedPoints: hostMember.snipeStats.points + newRankPoints,
    });
  }

  if (guestMember) {
    const guestPointsEarned = guestWon ? 3 : isDraw ? 1 : 0;
    const newScoreFor = guestMember.rankStats.scoreFor + args.guestScore;
    const newScoreAgainst = guestMember.rankStats.scoreAgainst + args.hostScore;
    const newTotalScore = guestMember.rankStats.totalScore + args.guestScore;
    const newRankPoints = guestMember.rankStats.points + guestPointsEarned;

    await ctx.db.patch(guestMember._id, {
      rankStats: {
        played: guestMember.rankStats.played + 1,
        won: guestMember.rankStats.won + (guestWon ? 1 : 0),
        drawn: guestMember.rankStats.drawn + (isDraw ? 1 : 0),
        lost: guestMember.rankStats.lost + (hostWon ? 1 : 0),
        scoreFor: newScoreFor,
        scoreAgainst: newScoreAgainst,
        scoreDiff: newScoreFor - newScoreAgainst,
        totalScore: newTotalScore,
        points: newRankPoints,
      },
      combinedPoints: guestMember.snipeStats.points + newRankPoints,
    });
  }

  const now = Date.now();
  await ctx.db.patch(leagueMatch._id, {
    guestUserId,
    hostScore: args.hostScore,
    guestScore: args.guestScore,
    winnerUserId,
    isDraw,
    status: 'completed',
    scoredAt: now,
  });
}
