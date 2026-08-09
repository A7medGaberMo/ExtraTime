import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { getFormationGraph } from "./formationGraph";

/**
 * Public lobby lookup for joining by code — returns minimal room info only
 * (bounded queries, no secret draft data leaks pre-join).
 */
export const getLobbyByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    if (!room) return null;
    return {
      roomId: room._id,
      gameType: room.gameType,
      status: room.status,
      hostId: room.hostId,
      guestId: room.guestId ?? undefined,
      formation: room.settings.formation,
    };
  },
});

export const getDraftState = query({
  args: { roomId: v.id("rooms"), userId: v.id("guestUsers") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== args.userId && room.guestId !== args.userId) {
      throw new Error("You are not in this room");
    }

    const draft = await ctx.db
      .query("squadDraftRooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!draft) throw new Error("Draft not found");

    const graph = getFormationGraph(draft.formation);
    const hostName = (await ctx.db.get(room.hostId))?.nickname ?? "Host";
    const guestName = room.guestId ? (await ctx.db.get(room.guestId))?.nickname ?? "Guest" : undefined;

    return {
      roomId: room._id,
      roomCode: room.code,
      poolMode: draft.poolMode,
      formation: {
        name: draft.formation,
        matchSize: graph?.matchSize ?? 11,
        nodes: graph?.nodes ?? [],
        edges: graph?.edges ?? [],
      },
      status: draft.status,
      currentRound: draft.currentRound,
      maxRounds: draft.maxRounds,
      activeUserId: draft.activeUserId,
      timerExpiresAt: draft.timerExpiresAt ?? undefined,
      hostRerollsLeft: draft.hostRerollsLeft,
      guestRerollsLeft: draft.guestRerollsLeft,
      players: {
        host: { id: room.hostId, name: hostName, isYou: room.hostId === args.userId },
        guest: room.guestId ? { id: room.guestId, name: guestName!, isYou: room.guestId === args.userId } : undefined,
      },
    };
  },
});

/** Hydrated view of the requesting user's picks (history + any active hidden set). */
export const getMyPicks = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const picks = await ctx.db
      .query("squadDraftPicks")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .collect();
    picks.sort((a, b) => a.roundNumber - b.roundNumber);

    const playerIds = new Set<string>();
    for (const p of picks) {
      for (const o of p.options) playerIds.add(String(o.playerId));
      if (p.selectedPlayerId) playerIds.add(String(p.selectedPlayerId));
    }

    const playerDocs = await Promise.all(
      [...playerIds].map((id) => ctx.db.get(id as Id<"players">))
    );
    const byId = new Map<string, NonNullable<(typeof playerDocs)[number]>>();
    for (const p of playerDocs) {
      if (p) byId.set(String(p._id), p);
    }

    const [clubs, nations] = await Promise.all([ctx.db.query("clubs").collect(), ctx.db.query("nations").collect()]);
    const clubById = new Map(clubs.map((c) => [String(c._id), c.name]));
    const nationById = new Map(nations.map((n) => [String(n._id), n.name]));

    return picks.map((p) => ({
      roundNumber: p.roundNumber,
      targetPosition: p.targetPosition,
      selectedSlotIndex: p.selectedSlotIndex ?? undefined,
      rerollCount: p.rerollCount,
      pickedAt: p.pickedAt ?? undefined,
      isJokerPicked: p.isJokerPicked ?? false,
      selected: p.selectedPlayerId
        ? {
            playerId: p.selectedPlayerId,
            name: byId.get(String(p.selectedPlayerId))?.name ?? "?",
            tier: byId.get(String(p.selectedPlayerId))?.tier ?? "",
            position: byId.get(String(p.selectedPlayerId))?.position ?? "",
            club: clubById.get(String(byId.get(String(p.selectedPlayerId))?.clubId)),
            nation: nationById.get(String(byId.get(String(p.selectedPlayerId))?.nationId)),
          }
        : undefined,
      options: p.options.map((o) => {
        const doc = byId.get(String(o.playerId));
        return {
          playerId: o.playerId,
          isJoker: o.isJoker,
          name: doc?.name ?? "?",
          tier: doc?.tier ?? "",
          position: doc?.position ?? "",
          club: clubById.get(String(doc?.clubId)),
          nation: nationById.get(String(doc?.nationId)),
        };
      }),
    }));
  },
});

export const getMySquad = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const squad = await ctx.db
      .query("squadDraftSquads")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .first();
    if (!squad) return null;

    const playerIds = squad.slots.filter((s) => s.playerId).map((s) => s.playerId!);
    const playerDocs = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const byId = new Map<string, (typeof playerDocs)[number]>();
    for (const p of playerDocs) if (p) byId.set(String(p._id), p);

    return {
      totalChem: squad.totalChem,
      totalOvr: squad.totalOvr,
      isSubmitted: squad.isSubmitted,
      slots: squad.slots.map((s) => ({
        slotIndex: s.slotIndex,
        position: s.position,
        isJoker: s.isJoker,
        chemContribution: s.chemContribution,
        syntheticOvr: s.syntheticOvr,
        player: s.playerId
          ? {
              playerId: s.playerId,
              name: byId.get(String(s.playerId))?.name ?? "?",
              tier: byId.get(String(s.playerId))?.tier ?? "",
              position: byId.get(String(s.playerId))?.position ?? "",
              imageUrl: byId.get(String(s.playerId))?.imageUrl ?? undefined,
            }
          : undefined,
      })),
    };
  },
});

export const getMatchResultByRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const match = await ctx.db
      .query("matches")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();
    if (!match || match.status !== "completed") return null;

    const room = await ctx.db.get(args.roomId);
    const guestId = room?.guestId;
    const [hostSquad, guestSquad] = room
      ? await Promise.all([
          ctx.db
            .query("squadDraftSquads")
            .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", room.hostId))
            .first(),
          guestId
            ? ctx.db
                .query("squadDraftSquads")
                .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", guestId))
                .first()
            : Promise.resolve(null),
        ])
      : [null, null];

    const winnerIsHost = match.winnerId === room?.hostId;
    return {
      matchId: match._id,
      score: match.score,
      winnerId: match.winnerId ?? undefined,
      winnerSide: match.winnerId ? (winnerIsHost ? "host" : "guest") : undefined,
      wasShootout: match.score.host === match.score.guest,
      seeded: match.seed,
      squads: {
        host: hostSquad ?? undefined,
        guest: guestSquad ?? undefined,
      },
    };
  },
});