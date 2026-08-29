import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const friendshipsTable = defineTable({
  requesterId: v.id('users'),
  addresseeId: v.id('users'),
  status: v.union(v.literal('pending'), v.literal('accepted'), v.literal('blocked')),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index('by_requester_status', ['requesterId', 'status'])
  .index('by_addressee_status', ['addresseeId', 'status'])
  .index('by_pair', ['requesterId', 'addresseeId']);
