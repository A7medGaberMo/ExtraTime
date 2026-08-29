import { defineTable } from 'convex/server';
import { v } from 'convex/values';
import { roomSettingsValidator } from '../lib/constants';

export const roomsTable = defineTable({
  code: v.string(),
  hostId: v.id('guestUsers'),
  guestId: v.optional(v.id('guestUsers')),
  hostUserId: v.optional(v.id('users')),       // Authenticated platform ownership
  guestUserId: v.optional(v.id('users')),      // Authenticated platform ownership
  leagueId: v.optional(v.id('leagues')),       // Context if launched from a league
  gameType: v.string(),
  status: v.union(
    v.literal('waiting'),
    v.literal('ready'),
    v.literal('in_progress'),
    v.literal('completed'),
    v.literal('abandoned'),
  ),
  isPublic: v.optional(v.boolean()),
  isSolo: v.optional(v.boolean()),
  settings: roomSettingsValidator,
  createdAt: v.number(),
})
  .index('by_code', ['code'])
  .index('by_status', ['status'])
  .index('by_host', ['hostId'])
  .index('by_host_status', ['hostId', 'status'])
  .index('by_guest_status', ['guestId', 'status'])
  .index('by_public_status', ['isPublic', 'status'])
  .index('by_league', ['leagueId']);
