import { mutation } from "../_generated/server";
import { Id, DataModel, Doc } from "../_generated/dataModel";
import { v } from "convex/values";
import { GenericMutationCtx } from "convex/server";
import {
  generateDraftOptions,
  bestOption,
  roundCountFor,
  getNodeForRound,
  validateFormation,
  ROUND_TIMER_MS,
  type PlayerPoolMode,
} from "./draftEngine";
import { getFormationGraph } from "./formationGraph";
import { lineFor, poolModeValidator, type Position, type Tier } from "../lib/constants";
import {
  calculateSquadChemistry,
  getPositionMatch,
  getSyntheticOVR,
  POSITION_FIT_FACTOR,
  type ChemPlayerInput,
  type ChemistryResult,
} from "../../src/core/chemistry/chemistryEngine";
import { simulateSquadDraftMatch, type SimSlot, type SquadDraftSimResult } from "../../src/core/simulation/squad-draft-simulator";

const GRACE_MS = 2000;

// ── Local helpers ──────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function generateUniqueRoomCode(ctx: GenericMutationCtx<DataModel>): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const existing = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique room code");
}

async function getDraft(ctx: GenericMutationCtx<DataModel>, roomId: Id<"rooms">): Promise<Doc<"squadDraftRooms">> {
  const draft = await ctx.db
    .query("squadDraftRooms")
    .withIndex("by_room", (q) => q.eq("roomId", roomId))
    .first();
  if (!draft) throw new Error("Squad draft not found");
  return draft;
}

async function getSquad(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">
): Promise<Doc<"squadDraftSquads"> | null> {
  return ctx.db
    .query("squadDraftSquads")
    .withIndex("by_room_user", (q) => q.eq("roomId", roomId).eq("userId", userId))
    .first();
}

function assertInRoom(room: Doc<"rooms">, userId: Id<"guestUsers">): void {
  if (room.hostId !== userId && room.guestId !== userId) throw new Error("You are not in this room");
}

function assertCanAct(draft: Doc<"squadDraftRooms">, room: Doc<"rooms">, userId: Id<"guestUsers">): void {
  if (room.hostId !== userId && room.guestId !== userId) throw new Error("Not in this room");
  if (draft.status !== "drafting") throw new Error("Draft is not in the drafting phase");
  if (draft.activeUserId !== userId) throw new Error("not your turn");
}

function assertTurnFresh(draft: Doc<"squadDraftRooms">): void {
  if (draft.timerExpiresAt && Date.now() > draft.timerExpiresAt + GRACE_MS) {
    throw new Error("Turn expired — auto-placement has taken over");
  }
}

async function getExcludedIds(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">
): Promise<Set<string>> {
  // Squad is derived from picks and only exists after finalize, so picks alone
  // are the single source of truth during drafting — no redundant squad scan.
  const picks = await ctx.db
    .query("squadDraftPicks")
    .withIndex("by_room_user", (q) => q.eq("roomId", roomId).eq("userId", userId))
    .collect();
  const excluded = new Set<string>();
  for (const p of picks) {
    if (p.selectedPlayerId) excluded.add(String(p.selectedPlayerId));
  }
  return excluded;
}

async function getActivePick(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">,
  roundNumber: number
): Promise<Doc<"squadDraftPicks">> {
  const picks = await ctx.db
    .query("squadDraftPicks")
    .withIndex("by_room_user", (q) => q.eq("roomId", roomId).eq("userId", userId))
    .collect();
  const pick = picks.find((p) => p.roundNumber === roundNumber);
  if (!pick) throw new Error("No active options for this round");
  return pick;
}

/** Persists the current round's option row for the active user (JIT reveal). */
async function storeRoundOptions(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">,
  formation: string,
  poolMode: PlayerPoolMode,
  round: number,
  draftId: Id<"squadDraftRooms">,
  isDuo: boolean = true
): Promise<void> {
  const target = getNodeForRound(formation, round, isDuo);
  const excluded = await getExcludedIds(ctx, roomId, userId);
  const options = await generateDraftOptions(ctx, {
    round,
    targetPosition: target.position,
    poolMode,
    excludePlayerIds: excluded,
    roomId: String(roomId),
    userId: String(userId),
  });

  await ctx.db.insert("squadDraftPicks", {
    roomId,
    userId,
    roundNumber: round,
    targetPosition: target.position,
    options,
    selectedPlayerId: undefined,
    selectedSlotIndex: undefined,
    isJokerPicked: undefined,
    rerollCount: 0,
    pickedAt: undefined,
  });

  await ctx.db.patch(draftId, { timerExpiresAt: Date.now() + ROUND_TIMER_MS });
}

/** Seeds the next user's turn: advance round + JIT options. */
async function advanceToNextTurn(
  ctx: GenericMutationCtx<DataModel>,
  room: Doc<"rooms">,
  draft: Doc<"squadDraftRooms">,
  round: number
): Promise<{ nextRound: number; activeUserId: Id<"guestUsers"> }> {
  const isDuo = Boolean(room.guestId);
  const maxRounds = roundCountFor(draft.formation, isDuo);
  const nextRound = round + 1;
  if (nextRound > maxRounds) {
    await ctx.db.patch(draft._id, {
      currentRound: nextRound,
      activeUserId: room.hostId,
      timerExpiresAt: undefined,
    });
    return { nextRound, activeUserId: room.hostId };
  }
  const nextUser: Id<"guestUsers"> = room.guestId
    ? draft.activeUserId === room.hostId
      ? room.guestId
      : room.hostId
    : draft.activeUserId;
  await ctx.db.patch(draft._id, {
    currentRound: nextRound,
    activeUserId: nextUser,
    timerExpiresAt: undefined,
  });
  await storeRoundOptions(ctx, roomIdOf(draft), nextUser, draft.formation, draft.poolMode, nextRound, draft._id, isDuo);
  return { nextRound, activeUserId: nextUser };
}

function roomIdOf(draft: Doc<"squadDraftRooms">): Id<"rooms"> {
  return draft.roomId;
}

/** Hydrate a user's picks into the chemistry engine input shape. */
async function prepareSquadRows(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">,
  formationName: string
): Promise<ChemPlayerInput[]> {
  const graph = getFormationGraph(formationName);
  if (!graph) throw new Error("Unknown formation " + formationName);
  // Use the compound by_room_user index to avoid scanning the opponent's picks.
  const picks = await ctx.db
    .query("squadDraftPicks")
    .withIndex("by_room_user", (q) => q.eq("roomId", roomId).eq("userId", userId))
    .collect();
  if (picks.length < graph.nodes.length) throw new Error("Draft not complete — missing picks");

  const inputs: ChemPlayerInput[] = [];
  for (const pick of picks) {
    if (!pick.selectedPlayerId) throw new Error(`Round ${pick.roundNumber} has no selection`);
    const player = await ctx.db.get(pick.selectedPlayerId);
    if (!player) throw new Error("Selected player missing");
    const [club, nation] = await Promise.all([ctx.db.get(player.clubId), ctx.db.get(player.nationId)]);
    inputs.push({
      id: player._id,
      position: player.position,
      tier: player.tier as Tier,
      clubKey: String(player.clubId),
      clubName: club?.name ?? "",
      nationKey: String(player.nationId),
      nationName: nation?.name ?? "",
      leagueKey: club?.league ?? "",
      isLegend: player.isLegend,
      isHeroFlag: player.tier === "HERO",
      isJoker: pick.isJokerPicked === true,
    });
  }
  return inputs;
}

function computeSquadChemistry(
  inputs: ChemPlayerInput[],
  formationName: string
): ChemistryResult {
  const graph = getFormationGraph(formationName)!;
  return calculateSquadChemistry(inputs, graph);
}

/** Fold a chemistry result into the pure simulator's slot shape. */
function toSimSlots(result: ChemistryResult, inputs: ChemPlayerInput[], formationName: string): SimSlot[] {
  const graph = getFormationGraph(formationName)!;
  const nodeBySlot = new Map(graph.nodes.map((n) => [n.slotIndex, n]));
  const inputById = new Map(inputs.map((i) => [i.id, i]));
  return result.players.map((p) => {
    const input = inputById.get(p.playerId);
    const node = nodeBySlot.get(p.slotIndex);
    const position = (node?.position ?? input?.position ?? "CM") as Position;
    const fitFactor = node && input ? POSITION_FIT_FACTOR[getPositionMatch(input.position, position)] : 0.8;
    const ovr = input?.isJoker
      ? Math.min(99, getSyntheticOVR(input.tier) + 4)
      : getSyntheticOVR(input?.tier ?? "BRONZE");
    return { line: lineFor(position) as SimSlot["line"], ovr, fitFactor };
  });
}

async function areBothSubmitted(
  ctx: GenericMutationCtx<DataModel>,
  room: Doc<"rooms">
): Promise<boolean> {
  if (!room.guestId) return true;
  const [host, guest] = await Promise.all([
    getSquad(ctx, room._id, room.hostId),
    getSquad(ctx, room._id, room.guestId),
  ]);
  return Boolean(host?.isSubmitted && guest?.isSubmitted);
}

async function persistSquad(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">,
  formationName: string,
  inputs: ChemPlayerInput[]
): Promise<ChemistryResult> {
  const graph = getFormationGraph(formationName)!;
  const chemistry = computeSquadChemistry(inputs, formationName);

  const nodeBySlot = new Map(graph.nodes.map((n) => [n.slotIndex, n]));
  const inputById = new Map(inputs.map((i) => [i.id, i]));
  const slots = chemistry.players.map((r) => ({
    slotIndex: r.slotIndex,
    position: nodeBySlot.get(r.slotIndex)?.position ?? "CM",
    playerId: r.playerId as Id<"players">,
    isJoker: inputById.get(r.playerId)?.isJoker ?? false,
    chemContribution: r.chem,
    syntheticOvr: inputById.get(r.playerId)?.isJoker
      ? Math.min(99, r.syntheticOvr + 4)
      : r.syntheticOvr,
  }));

  const existing = await getSquad(ctx, roomId, userId);
  if (existing) {
    await ctx.db.patch(existing._id, {
      slots,
      totalChem: chemistry.totalChem,
      totalOvr: chemistry.totalOvr,
      isSubmitted: true,
    });
  } else {
    await ctx.db.insert("squadDraftSquads", {
      roomId,
      userId,
      slots,
      totalChem: chemistry.totalChem,
      totalOvr: chemistry.totalOvr,
      isSubmitted: true,
    });
  }
  return chemistry;
}

/** Shared tail of finalize: simulates + persists the match row once both sides are in. */
async function finalizeMatchIfBoth(
  ctx: GenericMutationCtx<DataModel>,
  room: Doc<"rooms">,
  draft: Doc<"squadDraftRooms">,
  formationName: string
): Promise<{ matchReady: boolean; matchId?: Id<"matches">; winnerId?: Id<"guestUsers">; result?: SquadDraftSimResult }> {
  const bothDone = await areBothSubmitted(ctx, room);
  if (!bothDone) return { matchReady: false };

  const seed = `squad:${room._id}`;

  // Idempotency guard: a completed match row already exists (both clients can
  // race to finalize) — return it untouched instead of simulating again.
  const existingMatch = await ctx.db
    .query("matches")
    .withIndex("by_room", (q) => q.eq("roomId", room._id))
    .first();
  if (existingMatch) {
    await ctx.db.patch(draft._id, {
      status: "completed",
      activeUserId: room.hostId,
      timerExpiresAt: undefined,
    });
    await ctx.db.patch(room._id, { status: "completed" });
    return {
      matchReady: true,
      matchId: existingMatch._id,
      winnerId: existingMatch.winnerId,
      result: undefined,
    };
  }

  const hostInputs = await prepareSquadRows(ctx, room._id, room.hostId, formationName);
  const hostChem = computeSquadChemistry(hostInputs, formationName);
  const guestInputs = room.guestId
    ? await prepareSquadRows(ctx, room._id, room.guestId, formationName)
    : undefined;
  const guestChem = guestInputs ? computeSquadChemistry(guestInputs, formationName) : undefined;

  let result: SquadDraftSimResult;
  let winnerId: Id<"guestUsers"> | undefined;
  let matchId: Id<"matches"> | undefined;

  if (room.guestId && guestInputs && guestChem) {
    result = simulateSquadDraftMatch(
      toSimSlots(hostChem, hostInputs, formationName),
      toSimSlots(guestChem, guestInputs, formationName),
      hostChem.totalChem,
      guestChem.totalChem,
      seed,
      true
    );
    winnerId = result.winner === "host" ? room.hostId : result.winner === "guest" ? room.guestId : undefined;
    matchId = await ctx.db.insert("matches", {
      roomId: room._id,
      hostSquad: hostInputs.map((p) => p.id as Id<"players">),
      guestSquad: guestInputs.map((p) => p.id as Id<"players">),
      winnerId: winnerId ?? undefined,
      score: result.score,
      status: "completed",
      completedAt: Date.now(),
      seed,
      gameType: "squad_draft",
    });
  } else {
    // Solo draft — the host faces no guest; score persists so the result page
    // still resolves the room.
    result = simulateSquadDraftMatch(
      toSimSlots(hostChem, hostInputs, formationName),
      [],
      hostChem.totalChem,
      0,
      seed,
      false
    );
    winnerId = room.hostId;
    matchId = await ctx.db.insert("matches", {
      roomId: room._id,
      hostSquad: hostInputs.map((p) => p.id as Id<"players">),
      guestSquad: [],
      winnerId: winnerId ?? undefined,
      score: result.score,
      status: "completed",
      completedAt: Date.now(),
      seed,
      gameType: "squad_draft",
    });
  }

  await ctx.db.patch(draft._id, {
    status: "completed",
    activeUserId: room.hostId,
    timerExpiresAt: undefined,
  });
  await ctx.db.patch(room._id, { status: "completed" });

  return { matchReady: true, matchId, winnerId, result, phase: "submission" };
}

// ── Mutations ────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    hostId: v.id("guestUsers"),
    formation: v.string(),
    poolMode: v.optional(poolModeValidator),
  },
  handler: async (ctx, args) => {
    validateFormation(args.formation);
    const poolMode = args.poolMode ?? "GLOBAL";
    const graph = getFormationGraph(args.formation)!;
    const code = await generateUniqueRoomCode(ctx);
    const now = Date.now();

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: args.hostId,
      gameType: "SQUAD_DRAFT",
      status: "waiting",
      isPublic: false,
      settings: {
        formation: args.formation,
        matchSize: graph.matchSize,
        startingBudget: 0,
        poolMode,
      },
      createdAt: now,
    });

    await ctx.db.insert("squadDraftRooms", {
      roomId,
      formation: args.formation,
      poolMode,
      status: "waiting",
      currentRound: 1,
      activeUserId: args.hostId,
      timerExpiresAt: undefined,
      hostRerollsLeft: 1,
      guestRerollsLeft: 1,
      createdAt: now,
    });

    return { roomId, code, matched: false };
  },
});

export const createSolo = mutation({
  args: {
    userId: v.id("guestUsers"),
    formation: v.string(),
    poolMode: v.optional(poolModeValidator),
  },
  handler: async (ctx, args) => {
    validateFormation(args.formation);
    const poolMode = args.poolMode ?? "GLOBAL";
    const graph = getFormationGraph(args.formation)!;
    const code = await generateUniqueRoomCode(ctx);
    const now = Date.now();

    const roomId = await ctx.db.insert("rooms", {
      code,
      hostId: args.userId,
      gameType: "SQUAD_DRAFT",
      status: "in_progress",
      isPublic: false,
      settings: {
        formation: args.formation,
        matchSize: graph.matchSize,
        startingBudget: 0,
        poolMode,
      },
      createdAt: now,
    });

    const draftId = await ctx.db.insert("squadDraftRooms", {
      roomId,
      formation: args.formation,
      poolMode,
      status: "drafting",
      currentRound: 1,
      activeUserId: args.userId,
      timerExpiresAt: undefined,
      hostRerollsLeft: 1,
      guestRerollsLeft: 0,
      createdAt: now,
    });

    await storeRoundOptions(ctx, roomId, args.userId, args.formation, poolMode, 1, draftId, false);
    return { roomId, code, matched: true };
  },
});

export const join = mutation({
  args: {
    roomId: v.id("rooms"),
    guestId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.gameType !== "SQUAD_DRAFT") throw new Error("Room is not a Squad Draft");
    if (room.hostId === args.guestId) throw new Error("You cannot join your own room");
    if (room.guestId === args.guestId) throw new Error("Room is not open");
    if (room.guestId) throw new Error("Room is full");
    if (room.status !== "waiting") throw new Error("Room is not open");

    const draft = await getDraft(ctx, args.roomId);
    if (draft.status !== "waiting") throw new Error("Draft already started");

    await ctx.db.patch(room._id, { guestId: args.guestId, status: "in_progress" });
    await ctx.db.patch(draft._id, {
      status: "drafting",
      activeUserId: room.hostId,
      maxRounds: roundCountFor(draft.formation, true),
    });

    // JIT round-1 options for the host (host picks first).
    await storeRoundOptions(ctx, args.roomId, room.hostId, draft.formation, draft.poolMode, 1, draft._id, true);

    return { roomId: args.roomId, activeUserId: room.hostId };
  },
});

export const submitPick = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
    playerId: v.id("players"),
    slotIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const draft = await getDraft(ctx, args.roomId);
    assertCanAct(draft, room, args.userId);
    assertTurnFresh(draft);

    const isDuo = Boolean(room.guestId);
    const roundTarget = getNodeForRound(draft.formation, draft.currentRound, isDuo);
    if (args.slotIndex !== roundTarget.slotIndex) {
      throw new Error(`This round fills ${roundTarget.position} (slot ${roundTarget.slotIndex})`);
    }

    const pick = await getActivePick(ctx, args.roomId, args.userId, draft.currentRound);
    if (pick.selectedPlayerId) throw new Error("Already picked this round");
    const option = pick.options.find((o) => o.playerId === args.playerId);
    if (!option) throw new Error("Player is not one of your options");

    await ctx.db.patch(pick._id, {
      selectedPlayerId: option.playerId,
      selectedSlotIndex: args.slotIndex,
      isJokerPicked: option.isJoker,
      pickedAt: Date.now(),
    });

    const advanced = await advanceToNextTurn(ctx, room, draft, draft.currentRound);

    if (advanced.nextRound > roundCountFor(draft.formation, isDuo)) {
      if (!room.guestId) {
        return finalizeSquadImpl(ctx, args.roomId, args.userId);
      }
      return { roomId: args.roomId, nextRound: advanced.nextRound, phase: "submission" };
    }

    return { roomId: args.roomId, nextRound: advanced.nextRound, activeUserId: advanced.activeUserId };
  },
});

export const reroll = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const draft = await getDraft(ctx, args.roomId);
    assertCanAct(draft, room, args.userId);
    assertTurnFresh(draft);

    const rerollsLeft = room.hostId === args.userId ? draft.hostRerollsLeft : draft.guestRerollsLeft;
    if (rerollsLeft <= 0) throw new Error("No rerolls remaining");

    const pick = await getActivePick(ctx, args.roomId, args.userId, draft.currentRound);
    if (pick.selectedPlayerId) throw new Error("You already picked — reroll is closed");
    if (pick.rerollCount >= 1) throw new Error("One reroll per turn");

    const excluded = await getExcludedIds(ctx, args.roomId, args.userId);
    pick.options.forEach((o) => excluded.add(String(o.playerId)));
    const target = getNodeForRound(draft.formation, draft.currentRound, Boolean(room.guestId));
    const options = await generateDraftOptions(ctx, {
      round: draft.currentRound,
      targetPosition: target.position,
      poolMode: draft.poolMode,
      excludePlayerIds: excluded,
    });

    await ctx.db.patch(pick._id, { options, rerollCount: 1 });
    await ctx.db.patch(draft._id, {
      ...(room.hostId === args.userId
        ? { hostRerollsLeft: draft.hostRerollsLeft - 1 }
        : { guestRerollsLeft: draft.guestRerollsLeft - 1 }),
    });
    return { options, rerollsLeft: rerollsLeft - 1 };
  },
});

export const autoPlaceExpired = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    const draft = await getDraft(ctx, args.roomId);
    if (draft.status !== "drafting") throw new Error("Draft is not active");
    if (draft.activeUserId !== args.userId) throw new Error("not your turn");
    if (!draft.timerExpiresAt || Date.now() <= draft.timerExpiresAt + GRACE_MS) {
      throw new Error("Timer has not expired yet");
    }

    const pick = await getActivePick(ctx, args.roomId, args.userId, draft.currentRound);
    if (pick.selectedPlayerId) return { autoPlaced: false, reason: "already-picked" };

    const players = await Promise.all(pick.options.map((o) => ctx.db.get(o.playerId)));
    const tierById = new Map<string, { tier: string }>();
    for (const p of players) {
      if (p) tierById.set(String(p._id), { tier: p.tier });
    }
    const best = bestOption(pick.options, tierById);
    if (!best) throw new Error("Cannot auto-place — no options");

    const roundTarget = getNodeForRound(draft.formation, draft.currentRound, Boolean(room.guestId));
    await ctx.db.patch(pick._id, {
      selectedPlayerId: best.playerId,
      selectedSlotIndex: roundTarget.slotIndex,
      isJokerPicked: best.isJoker,
      pickedAt: Date.now(),
    });

    const advanced = await advanceToNextTurn(ctx, room, draft, draft.currentRound);
    if (advanced.nextRound > roundCountFor(draft.formation)) {
      if (!room.guestId) return finalizeSquadImpl(ctx, args.roomId, args.userId);
      return { autoPlaced: true, nextRound: advanced.nextRound, phase: "submission" };
    }
    return { autoPlaced: true, nextRound: advanced.nextRound, activeUserId: advanced.activeUserId };
  },
});

export const finalizeSquad = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("guestUsers"),
  },
  handler: async (ctx, args) => {
    return finalizeSquadImpl(ctx, args.roomId, args.userId);
  },
});

/** Assemble + persist this user's squad, then finish the match when both are in. */
async function finalizeSquadImpl(
  ctx: GenericMutationCtx<DataModel>,
  roomId: Id<"rooms">,
  userId: Id<"guestUsers">
): Promise<Awaited<ReturnType<typeof finalizeMatchIfBoth>> & { submitted: true; chemistry: ChemistryResult }> {
  const room = await ctx.db.get(roomId);
  if (!room) throw new Error("Room not found");
  assertInRoom(room, userId);
  const draft = await getDraft(ctx, roomId);

  const inputs = await prepareSquadRows(ctx, roomId, userId, draft.formation);
  const chemistry = await persistSquad(ctx, roomId, userId, draft.formation, inputs);

  const tail = await finalizeMatchIfBoth(ctx, room, draft, draft.formation);
  return { submitted: true, chemistry, ...tail };
}
