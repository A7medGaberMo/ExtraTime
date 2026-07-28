import { query } from "../_generated/server";
import { v } from "convex/values";
import { GenericQueryCtx } from "convex/server";
import { Id } from "../_generated/dataModel";

// ── Hydration Helper ───────────────────────────────────────

async function hydratePlayer(ctx: GenericQueryCtx<any>, p: {
  clubId: Id<"clubs">;
  nationId: Id<"nations">;
  [key: string]: any;
}) {
  const [club, nation] = await Promise.all([
    ctx.db.get(p.clubId),
    ctx.db.get(p.nationId),
  ]);
  return {
    ...p,
    club: club?.name ?? "Unknown Club",
    clubLogo: club?.logo ?? "",
    nation: nation?.name ?? "Unknown Nation",
    nationFlag: nation?.flag ?? "",
  };
}

// ── Queries ────────────────────────────────────────────────

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    return Promise.all(players.map((p) => hydratePlayer(ctx, p)));
  },
});

export const getById = query({
  args: { id: v.id("players") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) return null;
    return hydratePlayer(ctx, p);
  },
});

export const getByTier = query({
  args: { tier: v.string() },
  handler: async (ctx, args) => {
    // FIX: Use the by_tier index instead of full table scan + filter
    const players = await ctx.db
      .query("players")
      .withIndex("by_tier", (q) => q.eq("tier", args.tier as any))
      .collect();
    return Promise.all(players.map((p) => hydratePlayer(ctx, p)));
  },
});

export const getByPosition = query({
  args: { position: v.string() },
  handler: async (ctx, args) => {
    // NOTE: Full scan is intentional here — multi-position strings like "CDM/CM"
    // can't be indexed, so we must check each player's split positions in JS.
    const target = args.position.trim().toUpperCase();
    const players = await ctx.db.query("players").collect();
    const filtered = players.filter((player) =>
      player.position
        .split("/")
        .map((pos) => pos.trim().toUpperCase())
        .includes(target)
    );
    return Promise.all(filtered.map((p) => hydratePlayer(ctx, p)));
  },
});
