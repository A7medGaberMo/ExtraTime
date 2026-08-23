import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const guestsTable = defineTable({
  nickname: v.string(),
  avatarSeed: v.string(),
  sessionToken: v.optional(v.string()),
  createdAt: v.number(),
  lastActiveAt: v.number(),
})
  .index('by_nickname', ['nickname'])
  .index('by_sessionToken', ['sessionToken']);

