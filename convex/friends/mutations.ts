import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireUser } from '../lib/identity';

export const sendRequest = mutation({
  args: {
    addresseeId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.addresseeId) {
      throw new Error('You cannot send a friend request to yourself.');
    }

    const addressee = await ctx.db.get(args.addresseeId);
    if (!addressee) {
      throw new Error('User not found.');
    }

    // Check existing relationship in either direction
    const [outgoingEdge, incomingEdge] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', user._id).eq('addresseeId', args.addresseeId))
        .unique(),
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', args.addresseeId).eq('addresseeId', user._id))
        .unique(),
    ]);

    const existing = outgoingEdge || incomingEdge;

    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Unable to send friend request to this user.');
      }
      if (existing.status === 'accepted') {
        return { success: true, status: 'accepted', message: 'You are already friends.' };
      }
      if (existing.status === 'pending') {
        // If the other user already requested us, auto-accept!
        if (existing.requesterId === args.addresseeId) {
          await ctx.db.patch(existing._id, {
            status: 'accepted',
            updatedAt: Date.now(),
          });
          return { success: true, status: 'accepted', message: 'Friend request accepted.' };
        }
        return { success: true, status: 'pending', message: 'Friend request already sent.' };
      }
    }

    // Rate-limit check: max 30 pending outgoing requests
    const outgoingPending = await ctx.db
      .query('friendships')
      .withIndex('by_requester_status', (q) => q.eq('requesterId', user._id).eq('status', 'pending'))
      .collect();

    if (outgoingPending.length >= 30) {
      throw new Error('You have reached the maximum number of pending outgoing friend requests (30).');
    }

    const now = Date.now();
    const friendshipId = await ctx.db.insert('friendships', {
      requesterId: user._id,
      addresseeId: args.addresseeId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, status: 'pending', friendshipId };
  },
});

export const acceptRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error('Friend request not found.');
    }
    if (friendship.addresseeId !== user._id) {
      throw new Error('You can only accept friend requests sent to you.');
    }
    if (friendship.status === 'accepted') {
      return { success: true, alreadyAccepted: true };
    }

    await ctx.db.patch(friendship._id, {
      status: 'accepted',
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const declineRequest = mutation({
  args: {
    friendshipId: v.id('friendships'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      return { success: true, alreadyHandled: true };
    }
    if (friendship.addresseeId !== user._id && friendship.requesterId !== user._id) {
      throw new Error('Unauthorized to decline this request.');
    }

    await ctx.db.delete(friendship._id);
    return { success: true };
  },
});

export const removeFriend = mutation({
  args: {
    friendUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const [edge1, edge2] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', user._id).eq('addresseeId', args.friendUserId))
        .unique(),
      ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('requesterId', args.friendUserId).eq('addresseeId', user._id))
        .unique(),
    ]);

    const edge = edge1 || edge2;
    if (edge) {
      await ctx.db.delete(edge._id);
    }

    return { success: true };
  },
});

export const blockUser = mutation({
  args: {
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (user._id === args.targetUserId) {
      throw new Error('You cannot block yourself.');
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

    const now = Date.now();
    if (edge1) {
      await ctx.db.patch(edge1._id, { status: 'blocked', updatedAt: now });
    } else if (edge2) {
      await ctx.db.delete(edge2._id);
      await ctx.db.insert('friendships', {
        requesterId: user._id,
        addresseeId: args.targetUserId,
        status: 'blocked',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('friendships', {
        requesterId: user._id,
        addresseeId: args.targetUserId,
        status: 'blocked',
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

export const unblockUser = mutation({
  args: {
    targetUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const blockedEdge = await ctx.db
      .query('friendships')
      .withIndex('by_pair', (q) => q.eq('requesterId', user._id).eq('addresseeId', args.targetUserId))
      .unique();

    if (blockedEdge && blockedEdge.status === 'blocked') {
      await ctx.db.delete(blockedEdge._id);
    }

    return { success: true };
  },
});
