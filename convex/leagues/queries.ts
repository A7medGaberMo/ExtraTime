import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from '../lib/identity';

export const getMyLeagues = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query('leagueMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const leagues = await Promise.all(
      memberships.map(async (m) => {
        const league = await ctx.db.get(m.leagueId);
        if (!league) return null;

        const allMembers = await ctx.db
          .query('leagueMembers')
          .withIndex('by_league_user', (q) => q.eq('leagueId', league._id))
          .collect();

        // Compute user's rank in this league
        const sorted = [...allMembers].sort((a, b) => {
          if (league.gameScope === 'snipe') {
            if (b.snipeStats.points !== a.snipeStats.points) return b.snipeStats.points - a.snipeStats.points;
            return b.snipeStats.goalDiff - a.snipeStats.goalDiff;
          }
          if (league.gameScope === 'rank') {
            if (b.rankStats.points !== a.rankStats.points) return b.rankStats.points - a.rankStats.points;
            return b.rankStats.totalScore - a.rankStats.totalScore;
          }
          return b.combinedPoints - a.combinedPoints;
        });

        const myRankIndex = sorted.findIndex((sm) => sm.userId === user._id);

        return {
          leagueId: league._id,
          name: league.name,
          description: league.description,
          kind: league.kind,
          gameScope: league.gameScope,
          inviteCode: league.inviteCode || league._id.slice(-6).toUpperCase(),
          isOwner: league.ownerId === user._id,
          memberCount: allMembers.length,
          maxMembers: league.maxMembers,
          myRank: myRankIndex >= 0 ? myRankIndex + 1 : 1,
          myPoints:
            league.gameScope === 'snipe'
              ? m.snipeStats.points
              : league.gameScope === 'rank'
                ? m.rankStats.points
                : m.combinedPoints,
        };
      }),
    );

    return leagues.filter((l): l is NonNullable<typeof l> => l !== null);
  },
});

export const getDiscoverablePublicLeagues = query({
  args: {
    gameScope: v.optional(v.union(v.literal('all'), v.literal('snipe'), v.literal('rank'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(args.limit || 20, 50);

    const publicLeagues = await ctx.db
      .query('leagues')
      .withIndex('by_kind_scope', (q) => q.eq('kind', 'public'))
      .take(limit * 2);

    const filtered = publicLeagues.filter((l) => {
      if (!args.gameScope || args.gameScope === 'all') return true;
      return l.gameScope === args.gameScope || l.gameScope === 'both';
    });

    const result = await Promise.all(
      filtered.slice(0, limit).map(async (league) => {
        const owner = await ctx.db.get(league.ownerId);
        const members = await ctx.db
          .query('leagueMembers')
          .withIndex('by_league_user', (q) => q.eq('leagueId', league._id))
          .collect();

        const isMember = user ? members.some((m) => m.userId === user._id) : false;

        return {
          _id: league._id,
          name: league.name,
          description: league.description,
          kind: league.kind,
          gameScope: league.gameScope,
          inviteCode: league.inviteCode || league._id.slice(-6).toUpperCase(),
          ownerName: owner?.displayName || owner?.username || 'Manager',
          ownerAvatar: owner?.avatarSeed || 'seed-1',
          memberCount: members.length,
          maxMembers: league.maxMembers,
          isFull: members.length >= league.maxMembers,
          isMember,
          createdAt: league.createdAt,
        };
      }),
    );

    return result;
  },
});

export const getLeagueDetails = query({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const league = await ctx.db.get(args.leagueId);
    if (!league) return null;

    const rawMembers = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId))
      .collect();

    const owner = await ctx.db.get(league.ownerId);
    const isOwner = user ? league.ownerId === user._id : false;
    const isMember = user ? rawMembers.some((m) => m.userId === user._id) : false;

    // Hydrate members with user records
    const hydratedMembers = await Promise.all(
      rawMembers.map(async (m) => {
        const u = await ctx.db.get(m.userId);
        return {
          memberId: m._id,
          userId: m.userId,
          username: u?.username || 'player',
          displayName: u?.displayName || 'Player',
          avatarSeed: u?.avatarSeed || 'seed-1',
          role: m.role,
          snipeStats: m.snipeStats,
          rankStats: m.rankStats,
          combinedPoints: m.combinedPoints,
          joinedAt: m.joinedAt,
          isSelf: user ? m.userId === user._id : false,
        };
      }),
    );

    // Multi-tier sort standings
    const standings = {
      snipe: [...hydratedMembers].sort((a, b) => {
        if (b.snipeStats.points !== a.snipeStats.points) return b.snipeStats.points - a.snipeStats.points;
        if (b.snipeStats.won !== a.snipeStats.won) return b.snipeStats.won - a.snipeStats.won;
        if (b.snipeStats.goalDiff !== a.snipeStats.goalDiff) return b.snipeStats.goalDiff - a.snipeStats.goalDiff;
        if (b.snipeStats.goalsFor !== a.snipeStats.goalsFor) return b.snipeStats.goalsFor - a.snipeStats.goalsFor;
        return a.joinedAt - b.joinedAt;
      }),
      rank: [...hydratedMembers].sort((a, b) => {
        if (b.rankStats.points !== a.rankStats.points) return b.rankStats.points - a.rankStats.points;
        if (b.rankStats.won !== a.rankStats.won) return b.rankStats.won - a.rankStats.won;
        if (b.rankStats.scoreDiff !== a.rankStats.scoreDiff) return b.rankStats.scoreDiff - a.rankStats.scoreDiff;
        if (b.rankStats.totalScore !== a.rankStats.totalScore) return b.rankStats.totalScore - a.rankStats.totalScore;
        return a.joinedAt - b.joinedAt;
      }),
      combined: [...hydratedMembers].sort((a, b) => {
        if (b.combinedPoints !== a.combinedPoints) return b.combinedPoints - a.combinedPoints;
        const bTotalWins = b.snipeStats.won + b.rankStats.won;
        const aTotalWins = a.snipeStats.won + a.rankStats.won;
        if (bTotalWins !== aTotalWins) return bTotalWins - aTotalWins;
        return a.joinedAt - b.joinedAt;
      }),
    };

    return {
      league: {
        _id: league._id,
        name: league.name,
        description: league.description,
        kind: league.kind,
        gameScope: league.gameScope,
        inviteCode: league.inviteCode || league._id.slice(-6).toUpperCase(),
        ownerId: league.ownerId,
        ownerName: owner?.displayName || owner?.username || 'Owner',
        memberCount: rawMembers.length,
        maxMembers: league.maxMembers,
        createdAt: league.createdAt,
      },
      isOwner,
      isMember,
      standings,
    };
  },
});

export const getLeagueRecentMatches = query({
  args: {
    leagueId: v.id('leagues'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit || 15, 30);

    const matches = await ctx.db
      .query('leagueMatches')
      .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
      .order('desc')
      .take(limit);

    const hydrated = await Promise.all(
      matches.map(async (m) => {
        const [hostUser, guestUser] = await Promise.all([
          ctx.db.get(m.hostUserId),
          m.guestUserId ? ctx.db.get(m.guestUserId) : null,
        ]);

        return {
          _id: m._id,
          gameType: m.gameType,
          hostName: hostUser?.displayName || hostUser?.username || 'Host',
          hostAvatar: hostUser?.avatarSeed || 'seed-1',
          guestName: guestUser?.displayName || guestUser?.username || 'Opponent',
          guestAvatar: guestUser?.avatarSeed || 'seed-2',
          hostScore: m.hostScore,
          guestScore: m.guestScore,
          winnerUserId: m.winnerUserId,
          isDraw: m.isDraw,
          status: m.status,
          scoredAt: m.scoredAt,
          createdAt: m.createdAt,
        };
      }),
    );

    return hydrated;
  },
});
