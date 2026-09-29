import { defineSchema } from 'convex/server';
import { playersTable } from './players/schema';
import { clubsTable } from './clubs/schema';
import { nationsTable } from './nations/schema';
import { roomsTable } from './rooms/schema';
import { auctionsTable } from './auctions/schema';
import { matchesTable } from './matches/schema';
import { guestsTable, guestStatsTable } from './guests/schema';
import { rankQuestionsTable, rankGamesTable } from './rank/schema';
import { draftGamesTable } from './draft/schema';
import { bankQuestionsTable, guestQuestionHistoryTable, bankGamesTable } from './bank/schema';

export default defineSchema(
  {
    players: playersTable,
    clubs: clubsTable,
    nations: nationsTable,
    rooms: roomsTable,
    auctions: auctionsTable,
    matches: matchesTable,
    guestUsers: guestsTable,
    guestStats: guestStatsTable,
    rankQuestions: rankQuestionsTable,
    rankGames: rankGamesTable,
    draftGames: draftGamesTable,
    bankQuestions: bankQuestionsTable,
    guestQuestionHistory: guestQuestionHistoryTable,
    bankGames: bankGamesTable,
  },
  { schemaValidation: false }
);
