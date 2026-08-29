import { query } from '../_generated/server';
import { getCurrentUser } from '../lib/identity';

export const getMyPendingInvite = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const now = Date.now();
    const invites = await ctx.db
      .query('matchInvites')
      .withIndex('by_recipient_status', (q) =>
        q.eq('recipientUserId', user._id).eq('status', 'pending'),
      )
      .collect();

    // Filter valid unexpired invites
    const valid = invites
      .filter((inv) => inv.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (valid.length === 0) return null;

    const latest = valid[0];
    return {
      inviteId: latest._id,
      senderDisplayName: latest.senderDisplayName,
      senderAvatarSeed: latest.senderAvatarSeed,
      matchType: latest.matchType,
      roomCode: latest.roomCode,
      targetId: latest.targetId,
      createdAt: latest.createdAt,
      expiresAt: latest.expiresAt,
    };
  },
});
