import { defineTable } from "convex/server";
import { v } from "convex/values";

export const simulationTimelineEventValidator = v.object({
  id: v.string(),
  minute: v.number(),
  type: v.string(),
  team: v.union(v.literal("host"), v.literal("guest")),
  player: v.optional(
    v.object({
      id: v.string(),
      name: v.string(),
      tier: v.string(),
      position: v.string(),
    })
  ),
  assistPlayer: v.optional(
    v.object({
      id: v.string(),
      name: v.string(),
    })
  ),
  description: v.string(),
  scoreSnapshot: v.object({
    host: v.number(),
    guest: v.number(),
  }),
});

export const simulationPlayerRatingValidator = v.object({
  playerId: v.string(),
  name: v.string(),
  position: v.string(),
  tier: v.string(),
  isSub: v.boolean(),
  rating: v.number(),
  goals: v.number(),
  assists: v.number(),
  saves: v.optional(v.number()),
});

export const simulationSectorValidator = v.object({
  attack: v.number(),
  midfield: v.number(),
  defense: v.number(),
  totalRating: v.number(),
});

export const simulationSynergyValidator = v.object({
  clubChemLinks: v.number(),
  clubChemPoints: v.number(),
  nationChemLinks: v.number(),
  nationChemPoints: v.number(),
  budgetBonusPoints: v.number(),
  totalSynergyPoints: v.number(),
});

export const matchSimulationValidator = v.object({
  matchId: v.string(),
  roomId: v.string(),
  gameType: v.string(),
  seed: v.string(),
  score: v.object({
    host: v.number(),
    guest: v.number(),
  }),
  winnerId: v.optional(v.string()),
  isShootout: v.boolean(),
  shootoutScore: v.optional(
    v.object({
      host: v.number(),
      guest: v.number(),
    })
  ),
  sectors: v.object({
    host: simulationSectorValidator,
    guest: simulationSectorValidator,
  }),
  synergy: v.object({
    host: simulationSynergyValidator,
    guest: simulationSynergyValidator,
  }),
  timeline: v.array(simulationTimelineEventValidator),
  playerRatings: v.object({
    host: v.array(simulationPlayerRatingValidator),
    guest: v.array(simulationPlayerRatingValidator),
  }),
  generatedAt: v.number(),
});

export const matchesTable = defineTable({
  roomId: v.id("rooms"),
  hostSquad: v.array(v.id("players")),
  guestSquad: v.array(v.id("players")),
  winnerId: v.optional(v.id("guestUsers")),
  score: v.object({
    host: v.number(),
    guest: v.number(),
  }),
  status: v.union(
    v.literal("pending"),
    v.literal("simulating"),
    v.literal("completed")
  ),
  completedAt: v.optional(v.number()),
  // ── Deterministic simulation payload (Universal Score Hub contract) ──
  seed: v.optional(v.string()),
  gameType: v.optional(v.string()),
  simulation: v.optional(matchSimulationValidator),
}).index("by_room", ["roomId"]);