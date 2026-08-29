import { defineSchema } from 'convex/server';
import { playersTable } from './players/schema';
import { clubsTable } from './clubs/schema';
import { nationsTable } from './nations/schema';
import { roomsTable } from './rooms/schema';
import { auctionsTable } from './auctions/schema';
import { matchesTable } from './matches/schema';
import { guestsTable } from './guests/schema';
import { rankQuestionsTable, rankGamesTable } from './rank/schema';
import { usersTable } from './users/schema';
import { friendshipsTable } from './friends/schema';
import { gameResultsTable } from './history/schema';
import { leaguesTable, leagueMembersTable, leagueMatchesTable } from './leagues/schema';
import { matchInvitesTable } from './invites/schema';

export default defineSchema({
  // ── Existing Gameplay Tables (100% Unchanged Runtime) ──
  players: playersTable,
  clubs: clubsTable,
  nations: nationsTable,
  rooms: roomsTable,
  auctions: auctionsTable,
  matches: matchesTable,
  guestUsers: guestsTable,
  rankQuestions: rankQuestionsTable,
  rankGames: rankGamesTable,

  // ── v1 Platform Layer ──
  users: usersTable,
  friendships: friendshipsTable,
  gameResults: gameResultsTable,
  leagues: leaguesTable,
  leagueMembers: leagueMembersTable,
  leagueMatches: leagueMatchesTable,
  matchInvites: matchInvitesTable,
});
