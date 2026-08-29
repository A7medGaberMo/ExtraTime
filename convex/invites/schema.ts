import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const matchInvitesTable = defineTable({
  senderUserId: v.id('users'),
  senderDisplayName: v.string(),
  senderAvatarSeed: v.optional(v.string()),
  recipientUserId: v.id('users'),
  matchType: v.union(v.literal('snipe'), v.literal('rank')),
  roomCode: v.string(),
  targetId: v.string(), // roomId or gameId
  status: v.union(
    v.literal('pending'),
    v.literal('accepted'),
    v.literal('declined'),
    v.literal('expired'),
  ),
  createdAt: v.number(),
  expiresAt: v.number(),
})
  .index('by_recipient_status', ['recipientUserId', 'status'])
  .index('by_sender', ['senderUserId']);
