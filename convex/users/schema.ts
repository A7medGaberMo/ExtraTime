import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const usersTable = defineTable({
  clerkId: v.string(),                         // Clerk JWT subject
  username: v.string(),                        // Lowercase 3-15 chars, alphanumeric + _
  displayName: v.string(),                     // Display name (1-24 chars)
  avatarSeed: v.string(),                      // Visual avatar identifier ('seed-1' .. 'seed-12')
  bio: v.optional(v.string()),                 // Optional player bio (max 100 chars)
  profileComplete: v.boolean(),                // True once reviewed/updated in settings
  createdAt: v.number(),
  lastActiveAt: v.number(),
})
  .index('by_clerkId', ['clerkId'])
  .index('by_username', ['username']);
