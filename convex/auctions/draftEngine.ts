import { GenericMutationCtx } from "convex/server";
import { Id } from "../_generated/dataModel";
import { getFormationPositions, MatchSize, Position } from "./formations";

export type PlayerPoolMode = "GLOBAL" | "EPL" | "ICONS";

export interface DraftRound {
  roundNumber: number;
  position: Position;
  mainPlayerId: Id<"players">;
  subPlayerId: Id<"players">;
  isMysteryRound?: boolean;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function lineFor(position: string) {
  const normalized = normalizePosition(position);
  if (normalized === "GK") return "GK";
  if (["CB", "LB", "RB"].includes(normalized)) return "DEF";
  if (["CDM", "CM", "CAM"].includes(normalized)) return "MID";
  return "ATT";
}

function normalizePosition(position: string) {
  const value = position.trim().toUpperCase();
  if (value === "LM") return "LW";
  if (value === "RM") return "RW";
  return value;
}

function playerPositions(position: string) {
  return position.split("/").map(normalizePosition).filter(Boolean);
}

function matchesExact(playerPosition: string, formationPosition: Position) {
  return playerPositions(playerPosition).includes(formationPosition);
}

function matchesLine(playerPosition: string, formationPosition: Position) {
  const targetLine = lineFor(formationPosition);
  return playerPositions(playerPosition).some((position) => lineFor(position) === targetLine);
}

function countCompatiblePlayers(players: Array<{ position: string }>, position: Position) {
  const exact = players.filter((player) => matchesExact(player.position, position)).length;
  const line = players.filter((player) => matchesLine(player.position, position)).length;
  return { exact, line };
}

function selectPlayersForPosition<T extends { _id: any; position: string }>(
  source: T[],
  used: Set<string>,
  position: Position
): [T, T] {
  const unused = source.filter((p) => !used.has(p._id));

  // 1. Prefer exact position matches
  const exactMatches = unused.filter((p) => matchesExact(p.position, position));
  if (exactMatches.length >= 2) {
    const shuffled = shuffle(exactMatches);
    return [shuffled[0], shuffled[1]];
  }

  // 2. Fall back to line matches (DEF, MID, ATT, GK)
  const lineMatches = unused.filter(
    (p) => matchesExact(p.position, position) || matchesLine(p.position, position)
  );
  if (lineMatches.length >= 2) {
    const shuffled = shuffle(lineMatches);
    return [shuffled[0], shuffled[1]];
  }

  // 3. Fall back to any available unused players
  if (unused.length >= 2) {
    const shuffled = shuffle(unused);
    return [shuffled[0], shuffled[1]];
  }

  throw new Error(`Not enough players available to fulfill draft round for ${position}.`);
}

export async function generateDraftRounds(
  ctx: GenericMutationCtx<any>,
  formation: string,
  matchSize: MatchSize,
  poolMode: PlayerPoolMode
): Promise<DraftRound[]> {
  const formationPositions = getFormationPositions(formation, matchSize);
  const allPlayers = await ctx.db.query("players").collect();
  const clubs = await ctx.db.query("clubs").collect();
  const clubById = new Map(clubs.map((club) => [club._id, club]));
  const filtered = allPlayers.filter((player) => {
    if (poolMode === "ICONS") return player.isLegend || player.tier === "ICON";
    if (poolMode === "EPL") return clubById.get(player.clubId)?.league === "Premier League";
    return true;
  });

  const requiredPlayerCount = formationPositions.length * 2;
  const source = filtered.length >= requiredPlayerCount ? filtered : allPlayers;
  if (source.length < requiredPlayerCount) {
    throw new Error(`Not enough players for ${matchSize}P Hidden Bid (requires ${requiredPlayerCount} players).`);
  }

  const used = new Set<string>();
  const positionsByScarcity = formationPositions
    .map((position, originalIndex) => {
      const counts = countCompatiblePlayers(source, position);
      return { position, originalIndex, counts };
    })
    .sort((a, b) => a.counts.exact - b.counts.exact);

  const assignedRounds = positionsByScarcity.map(({ position, originalIndex }) => {
    const [main, sub] = selectPlayersForPosition(source, used, position);
    used.add(main._id);
    used.add(sub._id);
    return {
      originalIndex,
      position,
      mainPlayerId: main._id as Id<"players">,
      subPlayerId: sub._id as Id<"players">,
      isMysteryRound: Math.random() < 0.2,
    };
  });

  return shuffle(assignedRounds).map((round, index) => ({
    roundNumber: index + 1,
    position: round.position,
    mainPlayerId: round.mainPlayerId,
    subPlayerId: round.subPlayerId,
    isMysteryRound: round.isMysteryRound,
  }));
}
