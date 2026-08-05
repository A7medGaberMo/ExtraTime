import { defineTable } from "convex/server";
import { v } from "convex/values";

export const playerTransfersTable = defineTable({
  playerId: v.id("players"),
  playerName: v.optional(v.string()), // Player name for quick lookup / fallback
  season: v.optional(v.string()), // e.g. "2023-2024" or "2023"
  transferDate: v.string(), // ISO date e.g. "2023-07-03"
  ageAtTransfer: v.optional(v.number()), // e.g. 20

  fromClub: v.string(), // Selling club name
  fromClubId: v.optional(v.id("clubs")),
  toClub: v.string(), // Buying club name
  toClubId: v.optional(v.id("clubs")),

  fromLeague: v.optional(v.string()),
  toLeague: v.optional(v.string()),

  feeEuros: v.number(), // Numeric fee in Euros (0 for free/loan)
  feeFormatted: v.string(), // e.g. "€103.00m", "Free Transfer", "Loan €5m"
  marketValueEuros: v.optional(v.number()), // Estimated market value at time of transfer

  feeType: v.union(
    v.literal("TRANSFER"),
    v.literal("FREE"),
    v.literal("LOAN"),
    v.literal("YOUTH_PROMOTION")
  ),
  notes: v.optional(v.string()),
})
  .index("by_player", ["playerId"])
  .index("by_from_club", ["fromClub"])
  .index("by_to_club", ["toClub"])
  .index("by_fee", ["feeEuros"])
  .index("by_date", ["transferDate"]);
