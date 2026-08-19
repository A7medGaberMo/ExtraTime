import { defineTable } from "convex/server";
import { v } from "convex/values";

export const careerStatsTable = defineTable({
  apiId: v.union(v.number(), v.string()),
  name: v.string(),
  clubs: v.array(
    v.object({
      club: v.string(),
      appearances: v.number(),
      goals: v.number(),
    })
  ),
  national: v.array(
    v.object({
      team: v.string(),
      appearances: v.number(),
      goals: v.number(),
    })
  ),
  careerTotal: v.object({
    appearances: v.number(),
    goals: v.number(),
  }),
}).index("by_apiId", ["apiId"]);
