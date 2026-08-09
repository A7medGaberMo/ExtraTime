import { defineSchema } from "convex/server";
import { playersTable } from "./players/schema";
import { clubsTable } from "./clubs/schema";
import { nationsTable } from "./nations/schema";
import { roomsTable } from "./rooms/schema";
import { auctionsTable } from "./auctions/schema";
import { matchesTable } from "./matches/schema";
import { guestsTable } from "./guests/schema";
import { careerStatsTable } from "./careerStats/schema";
import { playerTransfersTable } from "./transfers/schema";
import { squadDraftRoomsTable, squadDraftPicksTable, squadDraftSquadsTable } from "./squadDraft/schema";

export default defineSchema({
  players: playersTable,
  clubs: clubsTable,
  nations: nationsTable,
  rooms: roomsTable,
  auctions: auctionsTable,
  matches: matchesTable,
  guestUsers: guestsTable,
  careerStats: careerStatsTable,
  playerTransfers: playerTransfersTable,
  squadDraftRooms: squadDraftRoomsTable,
  squadDraftPicks: squadDraftPicksTable,
  squadDraftSquads: squadDraftSquadsTable,
});
