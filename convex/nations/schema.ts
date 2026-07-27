import { defineTable } from "convex/server";
import { v } from "convex/values";

export const nationsTable = defineTable({
  name: v.string(),
  code: v.string(),
  flag: v.string(),
  confederation: v.string(),
  apiId: v.string(),
});
