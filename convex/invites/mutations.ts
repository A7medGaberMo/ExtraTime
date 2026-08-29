import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireUser } from '../lib/identity';

export const sendMatchInvite = mutation({
  args: {
    recipientUserId: v.id('users'),
    matchType: v.union(v.literal('snipe'), v.literal('rank')),
    roomCode: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const sender = await requireUser(ctx);
    const now = Date.now();

    // Expire any previous pending invites between this pair
    const previous = await ctx.db
      .query('matchInvites')
      .withIndex('by_recipient_status', (q) =>
        q.eq('recipientUserId', args.recipientUserId).eq('status', 'pending'),
      )
      .collect();

    for (const inv of previous) {
      if (inv.senderUserId === sender._id) {
        await ctx.db.patch(inv._id, { status: 'expired' });
      }
    }

    const inviteId = await ctx.db.insert('matchInvites', {
      senderUserId: sender._id,
      senderDisplayName: sender.displayName,
      senderAvatarSeed: sender.avatarSeed,
      recipientUserId: args.recipientUserId,
      matchType: args.matchType,
      roomCode: args.roomCode,
      targetId: args.targetId,
      status: 'pending',
      createdAt: now,
      expiresAt: now + 2 * 60 * 1000, // 2 minutes
    });

    return { inviteId };
  },
});

export const acceptMatchInvite = mutation({
  args: {
    inviteId: v.id('matchInvites'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.recipientUserId !== user._id) {
      throw new Error('Invite not found');
    }

    await ctx.db.patch(invite._id, { status: 'accepted' });
    return {
      matchType: invite.matchType,
      roomCode: invite.roomCode,
      targetId: invite.targetId,
    };
  },
});

export const declineMatchInvite = mutation({
  args: {
    inviteId: v.id('matchInvites'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const invite = await ctx.db.get(args.inviteId);
    if (!invite || invite.recipientUserId !== user._id) {
      return { success: true };
    }

    await ctx.db.patch(invite._id, { status: 'declined' });
    return { success: true };
  },
});
