import { defineTable } from "convex/server";
import { v } from "convex/values";
import { poolModeValidator } from "../lib/constants";

/** A single pick option presented to a manager during a draft turn. */
export const draftPickOptionValidator = v.object({
  playerId: v.id("players"),
  isJoker: v.boolean(),
});

/** A filled (or empty) pitch slot with its resolved chemistry/OVR contribution. */
export const squadSlotValidator = v.object({
  slotIndex: v.number(),
  position: v.string(),
  playerId: v.optional(v.id("players")),
  isJoker: v.boolean(),
  chemContribution: v.number(), // 0..3
  syntheticOvr: v.number(),
});

/**
 * Squad Draft room state — 1:1 with a `rooms` doc, keyed by roomId.
 */
export const squadDraftRoomsTable = defineTable({
  roomId: v.id("rooms"),
  formation: v.string(), // "4-3-3", "4-4-2", etc.
  poolMode: poolModeValidator,
  status: v.union(
    v.literal("waiting"),
    v.literal("drafting"),
    v.literal("completed"),
    v.literal("abandoned")
  ),
  currentRound: v.number(), // 1..maxRounds
  activeUserId: v.id("guestUsers"),
  timerExpiresAt: v.optional(v.number()),
  hostRerollsLeft: v.number(),
  guestRerollsLeft: v.number(),
  createdAt: v.number(),
})
  .index("by_room", ["roomId"])
  .index("by_status", ["status"]);

/**
 * A single draft turn: the 5 options shown, what was picked, reroll usage.
 */
export const squadDraftPicksTable = defineTable({
  roomId: v.id("rooms"),
  userId: v.id("guestUsers"),
  roundNumber: v.number(),
  targetPosition: v.string(),
  options: v.array(draftPickOptionValidator),
  selectedPlayerId: v.optional(v.id("players")),
  selectedSlotIndex: v.optional(v.number()),
  isJokerPicked: v.optional(v.boolean()),
  rerollCount: v.number(),
  pickedAt: v.optional(v.number()),
})
  .index("by_room_user", ["roomId", "userId"])
  .index("by_room_round", ["roomId", "roundNumber"]);

/**
 * Final assembled squad per manager with per-slot chemistry + synthetic OVR.
 */
export const squadDraftSquadsTable = defineTable({
  roomId: v.id("rooms"),
  userId: v.id("guestUsers"),
  slots: v.array(squadSlotValidator),
  totalChem: v.number(), // 0..(matchSize×3): 15 for 5v5, 33 for 11v11
  totalOvr: v.number(),
  isSubmitted: v.boolean(),
})
  .index("by_room_user", ["roomId", "userId"]);