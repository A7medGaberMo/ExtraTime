import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getUserMatchHistory = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 20, 50);

    const [p1Matches, p2Matches] = await Promise.all([
      ctx.db
        .query('gameResults')
        .withIndex('by_player1_completed', (q) => q.eq('player1UserId', args.userId))
        .order('desc')
        .take(limit),
      ctx.db
        .query('gameResults')
        .withIndex('by_player2_completed', (q) => q.eq('player2UserId', args.userId))
        .order('desc')
        .take(limit),
    ]);

    const combined = [...p1Matches, ...p2Matches]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, limit);

    // Hydrate opponent user info
    const hydrated = await Promise.all(
      combined.map(async (m) => {
        const isPlayer1 = m.player1UserId === args.userId;
        const opponentUserId = isPlayer1 ? m.player2UserId : m.player1UserId;
        const opponentGuestId = isPlayer1 ? m.player2GuestId : m.player1GuestId;

        let opponentName = 'Opponent';
        let opponentAvatar = 'seed-1';

        if (opponentUserId) {
          const u = await ctx.db.get(opponentUserId);
          if (u) {
            opponentName = u.displayName || u.username;
            opponentAvatar = u.avatarSeed;
          }
        } else if (opponentGuestId) {
          const g = await ctx.db.get(opponentGuestId);
          if (g) {
            opponentName = g.nickname;
            opponentAvatar = g.avatarSeed;
          }
        }

        const myScore = isPlayer1 ? m.player1Score : (m.player2Score ?? 0);
        const opponentScore = isPlayer1 ? (m.player2Score ?? 0) : m.player1Score;
        const won = m.winnerUserId === args.userId;
        const isDraw = m.isDraw;

        return {
          _id: m._id,
          gameType: m.gameType,
          context: m.context,
          leagueId: m.leagueId,
          myScore,
          opponentScore,
          won,
          isDraw,
          lost: !won && !isDraw,
          opponentName,
          opponentAvatar,
          opponentUserId,
          summary: m.summary,
          completedAt: m.completedAt,
        };
      }),
    );

    return hydrated;
  },
});

export const getUserCareerStats = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const [p1Matches, p2Matches] = await Promise.all([
      ctx.db
        .query('gameResults')
        .withIndex('by_player1_completed', (q) => q.eq('player1UserId', args.userId))
        .collect(),
      ctx.db
        .query('gameResults')
        .withIndex('by_player2_completed', (q) => q.eq('player2UserId', args.userId))
        .collect(),
    ]);

    const allMatches = [...p1Matches, ...p2Matches];

    let snipePlayed = 0;
    let snipeWins = 0;
    let snipeDraws = 0;
    let snipeLosses = 0;

    let rankPlayed = 0;
    let rankWins = 0;
    let rankDraws = 0;
    let rankLosses = 0;

    for (const m of allMatches) {
      const isWon = m.winnerUserId === args.userId;
      const isDraw = m.isDraw;
      const isLost = !isWon && !isDraw;

      if (m.gameType === 'snipe') {
        snipePlayed++;
        if (isWon) snipeWins++;
        else if (isDraw) snipeDraws++;
        else if (isLost) snipeLosses++;
      } else if (m.gameType === 'rank') {
        rankPlayed++;
        if (isWon) rankWins++;
        else if (isDraw) rankDraws++;
        else if (isLost) rankLosses++;
      }
    }

    return {
      snipe: {
        played: snipePlayed,
        won: snipeWins,
        drawn: snipeDraws,
        lost: snipeLosses,
        winRate: snipePlayed > 0 ? Math.round((snipeWins / snipePlayed) * 100) : 0,
      },
      rank: {
        played: rankPlayed,
        won: rankWins,
        drawn: rankDraws,
        lost: rankLosses,
        winRate: rankPlayed > 0 ? Math.round((rankWins / rankPlayed) * 100) : 0,
      },
      totalMatches: allMatches.length,
      totalWins: snipeWins + rankWins,
    };
  },
});
