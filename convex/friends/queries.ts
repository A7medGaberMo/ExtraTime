import { query } from '../_generated/server';
import { v } from 'convex/values';
import { getCurrentUser } from '../lib/identity';

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const [asRequester, asAddressee] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_requester_status', (q) => q.eq('requesterId', user._id).eq('status', 'accepted'))
        .collect(),
      ctx.db
        .query('friendships')
        .withIndex('by_addressee_status', (q) => q.eq('addresseeId', user._id).eq('status', 'accepted'))
        .collect(),
    ]);

    const friendIds = [
      ...asRequester.map((f) => ({ friendId: f.addresseeId, friendshipId: f._id, since: f.updatedAt })),
      ...asAddressee.map((f) => ({ friendId: f.requesterId, friendshipId: f._id, since: f.updatedAt })),
    ];

    const now = Date.now();
    const friends = await Promise.all(
      friendIds.map(async ({ friendId, friendshipId, since }) => {
        const friendUser = await ctx.db.get(friendId);
        if (!friendUser) return null;
        const isOnline = friendUser.lastActiveAt ? now - friendUser.lastActiveAt < 3 * 60 * 1000 : false;
        return {
          friendshipId,
          userId: friendUser._id,
          username: friendUser.username,
          displayName: friendUser.displayName,
          avatarSeed: friendUser.avatarSeed,
          bio: friendUser.bio,
          lastActiveAt: friendUser.lastActiveAt,
          isOnline,
          since,
        };
      }),
    );

    return friends.filter((f): f is NonNullable<typeof f> => f !== null);
  },
});

export const listIncomingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const incoming = await ctx.db
      .query('friendships')
      .withIndex('by_addressee_status', (q) => q.eq('addresseeId', user._id).eq('status', 'pending'))
      .collect();

    const hydrated = await Promise.all(
      incoming.map(async (req) => {
        const requester = await ctx.db.get(req.requesterId);
        if (!requester) return null;
        return {
          friendshipId: req._id,
          requesterId: requester._id,
          username: requester.username,
          displayName: requester.displayName,
          avatarSeed: requester.avatarSeed,
          createdAt: req.createdAt,
        };
      }),
    );

    return hydrated.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const listOutgoingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const outgoing = await ctx.db
      .query('friendships')
      .withIndex('by_requester_status', (q) => q.eq('requesterId', user._id).eq('status', 'pending'))
      .collect();

    const hydrated = await Promise.all(
      outgoing.map(async (req) => {
        const addressee = await ctx.db.get(req.addresseeId);
        if (!addressee) return null;
        return {
          friendshipId: req._id,
          addresseeId: addressee._id,
          username: addressee.username,
          displayName: addressee.displayName,
          avatarSeed: addressee.avatarSeed,
          createdAt: req.createdAt,
        };
      }),
    );

    return hydrated.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const getRelationshipStatus = query({
  args: { targetUserId: v.id('users') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user._id === args.targetUserId) {
      return { status: 'self' as const };
    }

    const [edge1, edge2] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', user._id).eq('addresseeId', args.targetUserId))
        .unique(),
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', args.targetUserId).eq('addresseeId', user._id))
        .unique(),
    ]);

    if (edge1) {
      if (edge1.status === 'accepted') return { status: 'friends' as const, friendshipId: edge1._id };
      if (edge1.status === 'pending') return { status: 'pending_outgoing' as const, friendshipId: edge1._id };
      if (edge1.status === 'blocked') return { status: 'blocked_by_me' as const };
    }

    if (edge2) {
      if (edge2.status === 'accepted') return { status: 'friends' as const, friendshipId: edge2._id };
      if (edge2.status === 'pending') return { status: 'pending_incoming' as const, friendshipId: edge2._id };
      if (edge2.status === 'blocked') return { status: 'blocked_by_them' as const };
    }

    return { status: 'none' as const };
  },
});
