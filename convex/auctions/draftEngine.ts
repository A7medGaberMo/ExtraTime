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

function canBuildCompatibleDraft(players: Array<{ _id: string; position: string }>, positions: Position[]) {
  if (players.length < positions.length * 2) return false;
  const used = new Set<string>();
  const ordered = positions
    .map((position) => ({ position, counts: countCompatiblePlayers(players, position) }))
    .sort((a, b) => a.counts.line - b.counts.line || a.counts.exact - b.counts.exact);

  for (const { position } of ordered) {
    let pool = players.filter((player) => !used.has(player._id) && matchesExact(player.position, position));
    if (pool.length < 2) {
      pool = players.filter((player) => !used.has(player._id) && matchesLine(player.position, position));
    }
    if (pool.length < 2) return false;
    used.add(pool[0]._id);
    used.add(pool[1]._id);
  }

  return true;
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
  const source = canBuildCompatibleDraft(filtered, formationPositions) ? filtered : allPlayers;
  const requiredPlayerCount = formationPositions.length * 2;
  if (source.length < requiredPlayerCount) {
    throw new Error(`Not enough players for ${matchSize}P Hidden Bid.`);
  }
  if (!canBuildCompatibleDraft(source, formationPositions)) {
    throw new Error(`Not enough compatible players for ${formation} ${matchSize}P Hidden Bid.`);
  }

  const used = new Set<string>();
  const positionsByScarcity = formationPositions
    .map((position, originalIndex) => {
      const counts = countCompatiblePlayers(source, position);
      return { position, originalIndex, counts };
    })
    .sort((a, b) => a.counts.line - b.counts.line || a.counts.exact - b.counts.exact);

  const assignedRounds = positionsByScarcity.map(({ position, originalIndex }) => {
    let pool = source.filter((player) => !used.has(player._id) && matchesExact(player.position, position));
    if (pool.length < 2) {
      pool = source.filter((player) => !used.has(player._id) && matchesLine(player.position, position));
    }
    if (pool.length < 2) {
      throw new Error(`Not enough ${position}-compatible players for ${formation} ${matchSize}P.`);
    }
    const [main, sub] = shuffle(pool);
    used.add(main._id);
    used.add(sub._id);
    return {
      originalIndex,
      position,
      mainPlayerId: main._id,
      subPlayerId: sub._id,
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
