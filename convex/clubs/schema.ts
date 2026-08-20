import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const clubsTable = defineTable({
  name: v.string(),
  shortName: v.string(),
  logo: v.string(),
  league: v.string(),
  country: v.string(),
  apiId: v.string(),
})
  .index('by_league', ['league'])
  .index('by_name', ['name']);
