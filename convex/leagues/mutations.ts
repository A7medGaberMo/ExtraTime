import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireUser } from '../lib/identity';
import { verifyGuestSession } from '../lib/auth';
import {
  generateCrockfordCode,
  generateUniqueRoomCode,
  generateUniqueRankRoomCode,
  randomPerk,
  generateRoomSeed,
} from '../lib/codeGen';
import { generateDraftRounds } from '../auctions/draftEngine';
import { getRandomFormation, MatchSize } from '../auctions/formations';
import { type PoolMode } from '../lib/constants';
import { isProfane } from '../lib/profanity';
import { pickRandomQuestionIds } from '../rank/mutations';


// ── League Management Mutations ────────────────────────────────────────

export const createLeague = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    kind: v.union(v.literal('public'), v.literal('private')),
    gameScope: v.union(v.literal('both'), v.literal('snipe'), v.literal('rank')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const cleanName = args.name.trim();

    if (cleanName.length < 3 || cleanName.length > 32) {
      throw new Error('League name must be between 3 and 32 characters.');
    }
    if (isProfane(cleanName)) {
      throw new Error('League name contains prohibited words.');
    }
    if (args.description && isProfane(args.description)) {
      throw new Error('League description contains prohibited words.');
    }

    const inviteCode = generateCrockfordCode(8);
    const now = Date.now();

    const leagueId = await ctx.db.insert('leagues', {
      name: cleanName,
      description: args.description?.trim().slice(0, 120),
      kind: args.kind,
      gameScope: args.gameScope,
      inviteCode,
      ownerId: user._id,
      maxMembers: 50,
      createdAt: now,
    });

    // Owner auto-joins with zeroed stats
    await ctx.db.insert('leagueMembers', {
      leagueId,
      userId: user._id,
      role: 'owner',
      snipeStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
      rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
      combinedPoints: 0,
      joinedAt: now,
    });

    return { leagueId, inviteCode };
  },
});

export const joinPublicLeague = mutation({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const league = await ctx.db.get(args.leagueId);

    if (!league) throw new Error('League not found.');

    const existingMember = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId).eq('userId', user._id))
      .first();

    if (existingMember) {
      return { success: true, alreadyMember: true };
    }

    const members = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId))
      .collect();

    if (members.length >= league.maxMembers) {
      throw new Error('This league has reached the maximum capacity of 50 members.');
    }

    await ctx.db.insert('leagueMembers', {
      leagueId: args.leagueId,
      userId: user._id,
      role: 'member',
      snipeStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
      rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
      combinedPoints: 0,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

export const joinLeagueByCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const cleanCode = args.inviteCode.trim().toUpperCase();

    let league = await ctx.db
      .query('leagues')
      .withIndex('by_inviteCode', (q) => q.eq('inviteCode', cleanCode))
      .first();

    // Fallback search by direct ID safely if provided
    if (!league) {
      try {
        // @ts-expect-error safe ID lookup fallback
        const directDoc = await ctx.db.get(args.inviteCode.trim());
        if (directDoc && 'ownerId' in directDoc) {
          league = directDoc;
        }
      } catch {
        // Not a valid ID string
      }
    }

    if (!league) {
      throw new Error('Invalid invite code. League not found.');
    }


    const existingMember = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', league._id).eq('userId', user._id))
      .first();

    if (existingMember) {
      return { success: true, leagueId: league._id, alreadyMember: true };
    }

    const members = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', league._id))
      .collect();

    if (members.length >= league.maxMembers) {
      throw new Error('This league is full (maximum 50 members).');
    }

    await ctx.db.insert('leagueMembers', {
      leagueId: league._id,
      userId: user._id,
      role: 'member',
      snipeStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 },
      rankStats: { played: 0, won: 0, drawn: 0, lost: 0, scoreFor: 0, scoreAgainst: 0, scoreDiff: 0, totalScore: 0, points: 0 },
      combinedPoints: 0,
      joinedAt: Date.now(),
    });

    return { success: true, leagueId: league._id };
  },
});

export const leaveLeague = mutation({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const membership = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId).eq('userId', user._id))
      .first();

    if (!membership) {
      return { success: true, alreadyLeft: true };
    }

    if (membership.role === 'owner') {
      const allMembers = await ctx.db
        .query('leagueMembers')
        .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId))
        .collect();

      if (allMembers.length > 1) {
        throw new Error('As league owner, you cannot leave while other members remain.');
      }

      // If owner is the only member, clean up league
      await ctx.db.delete(membership._id);
      await ctx.db.delete(args.leagueId);
      return { success: true, leagueDeleted: true };
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});

export const kickMember = mutation({
  args: {
    leagueId: v.id('leagues'),
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const league = await ctx.db.get(args.leagueId);

    if (!league) throw new Error('League not found.');
    if (league.ownerId !== user._id) {
      throw new Error('Only the league owner can remove members.');
    }
    if (args.targetUserId === user._id) {
      throw new Error('Cannot kick yourself from your own league.');
    }

    const targetMembership = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId).eq('userId', args.targetUserId))
      .first();

    if (targetMembership) {
      await ctx.db.delete(targetMembership._id);
    }

    return { success: true };
  },
});

// ── Dedicated League Launch APIs ────────────────────────────────────────

export const createLeagueSnipeMatch = mutation({
  args: {
    leagueId: v.id('leagues'),
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    matchSize: v.optional(v.union(v.literal(5), v.literal(11))),
    startingBudget: v.optional(v.number()),
    poolMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error('League not found.');
    if (league.gameScope === 'rank') {
      throw new Error('Snipe Auction is not supported in this Rank-only league.');
    }

    const member = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId).eq('userId', user._id))
      .first();

    if (!member) {
      throw new Error('You must be a member of this league to launch a match.');
    }

    const matchSize: MatchSize = args.matchSize ?? 11;
    const startingBudget = args.startingBudget ?? 100;
    const poolMode = (args.poolMode ?? 'GLOBAL') as PoolMode;
    const formation = getRandomFormation(matchSize);
    const rounds = await generateDraftRounds(ctx, formation, matchSize, poolMode);
    const hostPerk = randomPerk();
    const code = await generateUniqueRoomCode(ctx);
    const now = Date.now();
    const seed = generateRoomSeed();

    const roomId = await ctx.db.insert('rooms', {
      code,
      hostId: args.hostId,
      hostUserId: user._id,
      leagueId: args.leagueId,
      gameType: 'HIDDEN_BID',
      status: 'waiting',
      isPublic: false,
      settings: {
        formation,
        matchSize,
        startingBudget,
        poolMode,
      },
      createdAt: now,
    });

    await ctx.db.insert('auctions', {
      roomId,
      formation,
      matchSize,
      startingBudget,
      poolMode,
      rounds,
      currentRound: 1,
      status: 'pending',
      seed,
      sealedBids: {},
      bidDeadline: now + 30000,
      roundHistory: [],
      currentBidding: {
        highestBid: 0,
        highestBidderId: undefined,
        activeTurnUserId: args.hostId,
        turnExpiresAt: now + 30000,
        firstPassUserId: undefined,
      },
      host: {
        userId: args.hostId,
        budget: startingBudget,
        perk: hostPerk,
        perkUsed: false,
        squad: [],
      },
      createdAt: now,
    });

    // Record pending league match
    await ctx.db.insert('leagueMatches', {
      leagueId: args.leagueId,
      gameType: 'snipe',
      roomId,
      hostUserId: user._id,
      status: 'pending',
      createdAt: now,
    });

    return { roomId, code };
  },
});

export const joinLeagueSnipeMatch = mutation({
  args: {
    roomId: v.id('rooms'),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);

    const room = await ctx.db.get(args.roomId);
    if (!room || !room.leagueId) {
      throw new Error('League room not found.');
    }

    const member = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', room.leagueId!).eq('userId', user._id))
      .first();

    if (!member) {
      throw new Error('You must be a member of this league to join this match.');
    }

    if (room.hostUserId === user._id) {
      throw new Error('You cannot join your own match as the opponent.');
    }

    const auction = await ctx.db
      .query('auctions')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();

    if (!auction) throw new Error('Auction not found.');

    if (room.status !== 'waiting' || room.guestId) {
      throw new Error('Room is no longer available.');
    }

    const guestPerk = randomPerk();
    const activeTurnUserId = auction.host.userId;
    const now = Date.now();

    await ctx.db.patch(args.roomId, {
      guestId: args.guestId,
      guestUserId: user._id,
      status: 'in_progress',
    });

    await ctx.db.patch(auction._id, {
      status: 'active',
      guest: {
        userId: args.guestId,
        budget: auction.startingBudget,
        perk: guestPerk,
        perkUsed: false,
        squad: [],
      },
      sealedBids: {},
      bidDeadline: now + 30000,
      roundHistory: [],
      currentBidding: {
        highestBid: 0,
        highestBidderId: undefined,
        activeTurnUserId,
        turnExpiresAt: now + 30000,
        firstPassUserId: undefined,
      },
    });

    const pendingLeagueMatch = await ctx.db
      .query('leagueMatches')
      .withIndex('by_room', (q) => q.eq('roomId', args.roomId))
      .first();

    if (pendingLeagueMatch) {
      await ctx.db.patch(pendingLeagueMatch._id, { guestUserId: user._id });
    }

    return { success: true, activeTurnUserId };
  },
});

export const createLeagueRankDuel = mutation({
  args: {
    leagueId: v.id('leagues'),
    hostId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
    roundCount: v.union(v.literal(3), v.literal(5)),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await verifyGuestSession(ctx, args.hostId, args.sessionToken);

    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error('League not found.');
    if (league.gameScope === 'snipe') {
      throw new Error('Rank Duels are not supported in this Snipe-only league.');
    }

    const member = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId).eq('userId', user._id))
      .first();

    if (!member) {
      throw new Error('You must be a member of this league to launch a duel.');
    }

    const hostGuest = await ctx.db.get(args.hostId);
    const now = Date.now();
    const code = await generateUniqueRankRoomCode(ctx);

    const gameId = await ctx.db.insert('rankGames', {
      code,
      mode: 'duel_private',
      isPublic: false,
      leagueId: args.leagueId,
      status: 'waiting',
      roundCount: args.roundCount,
      currentRoundIndex: 0,
      questionIds: [],
      participants: [
        {
          guestId: args.hostId,
          userId: user._id,
          name: hostGuest?.nickname ?? user.displayName,
          avatarSeed: hostGuest?.avatarSeed ?? user.avatarSeed,
          totalScore: 0,
          roundScores: [],
          hasSubmittedCurrentRound: false,
        },
      ],
      roundHistory: [],
      createdAt: now,
    });

    await ctx.db.insert('leagueMatches', {
      leagueId: args.leagueId,
      gameType: 'rank',
      rankGameId: gameId,
      hostUserId: user._id,
      status: 'pending',
      createdAt: now,
    });

    return { gameId, code };
  },
});

export const joinLeagueRankDuel = mutation({
  args: {
    code: v.string(),
    guestId: v.id('guestUsers'),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await verifyGuestSession(ctx, args.guestId, args.sessionToken);

    const cleanCode = args.code.trim().toUpperCase().slice(0, 6);
    const game = await ctx.db
      .query('rankGames')
      .withIndex('by_code', (q) => q.eq('code', cleanCode))
      .first();

    if (!game || !game.leagueId) {
      throw new Error('League rank duel not found.');
    }

    const member = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', game.leagueId!).eq('userId', user._id))
      .first();

    if (!member) {
      throw new Error('You must be a member of this league to join this duel.');
    }

    if (game.participants.some((p) => p.userId === user._id)) {
      return { gameId: game._id }; // Allow rejoin
    }

    if (game.status !== 'waiting' || game.participants.length >= 2) {
      throw new Error('This duel is no longer available.');
    }

    const guestProfile = await ctx.db.get(args.guestId);
    const questionIds = await pickRandomQuestionIds(ctx, game.roundCount, [
      game.participants[0].guestId,
      args.guestId,
    ]);
    const now = Date.now();

    const updatedParticipants = [
      ...game.participants,
      {
        guestId: args.guestId,
        userId: user._id,
        name: guestProfile?.nickname ?? user.displayName,
        avatarSeed: guestProfile?.avatarSeed ?? user.avatarSeed,
        totalScore: 0,
        roundScores: [],
        hasSubmittedCurrentRound: false,
      },
    ];

    await ctx.db.patch(game._id, {
      status: 'round_active',
      questionIds,
      roundStartedAt: now,
      roundDeadline: now + 45000,
      participants: updatedParticipants,
    });

    const pendingLeagueMatch = await ctx.db
      .query('leagueMatches')
      .withIndex('by_rankGame', (q) => q.eq('rankGameId', game._id))
      .first();

    if (pendingLeagueMatch) {
      await ctx.db.patch(pendingLeagueMatch._id, { guestUserId: user._id });
    }

    return { gameId: game._id };
  },
});

export const deleteLeague = mutation({
  args: { leagueId: v.id('leagues') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error('League not found.');
    if (league.ownerId !== user._id) {
      throw new Error('Only the league owner can delete the league.');
    }

    // Delete all members in parallel
    const members = await ctx.db
      .query('leagueMembers')
      .withIndex('by_league_user', (q) => q.eq('leagueId', args.leagueId))
      .collect();
    await Promise.all(members.map((m) => ctx.db.delete(m._id)));

    // Delete all league matches in parallel
    const matches = await ctx.db
      .query('leagueMatches')
      .withIndex('by_league', (q) => q.eq('leagueId', args.leagueId))
      .collect();
    await Promise.all(matches.map((match) => ctx.db.delete(match._id)));

    // Delete league document
    await ctx.db.delete(args.leagueId);
    return { success: true };
  },
});

