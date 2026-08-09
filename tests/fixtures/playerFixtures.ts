import { FakeConvexDb } from "./fake-convex-db";

export interface FixturePlayers {
  clubs: Record<string, string>; // key → clubId
  nations: Record<string, string>; // key → nationId
  players: Record<string, string>; // key → playerId
}

export type PlayerSeed = {
  key: string;
  name: string;
  position: string;
  tier: string;
  isLegend?: boolean;
  club?: string; // club key
  nation?: string; // nation key
  isSynthetic?: boolean;
};

const DEFAULT_CLUBS = {
  lfc: { name: "Liverpool", league: "Premier League" },
  mci: { name: "Man City", league: "Premier League" },
  rma: { name: "Real Madrid", league: "La Liga" },
  bca: { name: "Barcelona", league: "La Liga" },
  bay: { name: "Bayern", league: "Bundesliga" },
  leg: { name: "Legends FC", league: "Global Legends" },
};

const DEFAULT_NATIONS = {
  eng: "England",
  spa: "Spain",
  ger: "Germany",
  bra: "Brazil",
};

/**
 * Seeds clubs, nations and a player pool so draft option generation has
 * real data to work with. Returns ids keyed by name.
 */
export function seedPlayerPool(
  db: FakeConvexDb,
  players: PlayerSeed[] = DEFAULT_PLAYERS
): FixturePlayers {
  const clubs: Record<string, string> = {};
  for (const [key, c] of Object.entries(seedClubs)) {
    clubs[key] = db.seed("clubs", c);
  }
  const nations: Record<string, string> = {};
  for (const [key, name] of Object.entries(seedNations)) {
    nations[key] = db.seed("nations", { name });
  }

  const byKey: Record<string, string> = {};
  for (const p of players) {
    byKey[p.key] = db.seed("players", {
      name: p.name,
      position: p.position,
      clubId: clubs[p.club ?? "lfc"],
      nationId: nations[p.nation ?? "eng"],
      tier: p.tier,
      isLegend: p.isLegend ?? false,
      isSynthetic: p.isSynthetic ?? false,
      seasonYear: undefined,
    });
  }
  return { clubs, nations, players: byKey };
}

export function seedGuest(db: FakeConvexDb, nickname: string): string {
  return db.seed("guestUsers", { nickname, avatarSeed: nickname, createdAt: Date.now(), lastActiveAt: Date.now() });
}

export const DEFAULT_PLAYERS: PlayerSeed[] = [
  { key: "gkIconA", name: "Iker Legend", position: "GK", tier: "ICON", club: "leg", nation: "spa", isLegend: true },
  { key: "gkGold", name: "Alisson Silva", position: "GK", tier: "GOLD", club: "lfc", nation: "bra" },
  { key: "gkElo", name: "Courtois X", position: "GK", tier: "ELITE", club: "rma", nation: "spa" },
  // Defenders
  { key: "cbGoldA", name: "Van Dijk", position: "CB", tier: "GOLD", club: "lfc", nation: "ger" },
  { key: "cbGoldB", name: "Dias", position: "CB", tier: "GOLD", club: "mci", nation: "eng" },
  { key: "cbElo", name: "Rudiger", position: "CB", tier: "ELITE", club: "rma", nation: "ger" },
  { key: "lbGold", name: "Robertson", position: "LB", tier: "GOLD", club: "lfc", nation: "eng" },
  { key: "rbGold", name: "Walker", position: "RB", tier: "ELITE", club: "mci", nation: "eng" },
  // Midfielders
  { key: "cmGoldA", name: "Trent", position: "CM", tier: "GOLD", club: "lfc", nation: "eng" },
  { key: "cmGoldB", name: "Kova", position: "CM", tier: "GOLD", club: "mci", nation: "bra" },
  { key: "cdmGold", name: "Rodri", position: "CDM", tier: "ELITE", club: "mci", nation: "spa" },
  { key: "camGold", name: "Bellingham", position: "CAM", tier: "ELITE", club: "rma", nation: "eng" },
  { key: "lmGold", name: "Martinelli", position: "LM", tier: "GOLD", club: "lfc", nation: "bra" },
  { key: "rmGold", name: "Salah", position: "RM", tier: "ELITE", club: "lfc", nation: "eng" },
  // Attackers
  { key: "stGoldA", name: "Haaland", position: "ST", tier: "ELITE", club: "mci", nation: "ger" },
  { key: "stGoldB", name: "Nunez", position: "ST", tier: "GOLD", club: "lfc", nation: "bra" },
  { key: "lwGold", name: "Vini", position: "LW", tier: "ELITE", club: "rma", nation: "bra" },
  { key: "rwGold", name: "Foden", position: "RW", tier: "GOLD", club: "mci", nation: "eng" },
  { key: "stIcon", name: "R9 Legend", position: "ST", tier: "ICON", club: "leg", nation: "bra", isLegend: true },
  { key: "heroZizou", name: "Zizou Hero", position: "CAM", tier: "HERO", club: "leg", nation: "spa", isLegend: true },
  // Variants (natural position swaps for fit tests)
  { key: "cfGold", name: "Benzema", position: "CF", tier: "ELITE", club: "rma", nation: "spa" },
  { key: "lwbGold", name: "Cancelo", position: "LWB", tier: "GOLD", club: "mci", nation: "eng" },
  { key: "multi", name: "JJ Multi", position: "CDM/CM", tier: "GOLD", club: "bay", nation: "ger" },
  // Extra Premier League cards so EPL-mode pools can fill 5 without fallback.
  { key: "stLfcA", name: "Pl ST One", position: "ST", tier: "ELITE", club: "lfc", nation: "eng" },
  { key: "stLfcB", name: "Pl ST Two", position: "ST", tier: "GOLD", club: "lfc", nation: "ger" },
  { key: "cfPl", name: "Pl CF", position: "CF", tier: "GOLD", club: "mci", nation: "eng" },
];

const seedClubs: Record<string, { name: string; league: string }> = {
  lfc: { name: "Liverpool", league: "Premier League" },
  mci: { name: "Man City", league: "Premier League" },
  rma: { name: "Real Madrid", league: "La Liga" },
  leg: { name: "Legends FC", league: "Global Legends" },
  bay: { name: "Bayern Munich", league: "Bundesliga" },
};

const seedNations: Record<string, string> = {
  eng: "England",
  spa: "Spain",
  ger: "Germany",
  bra: "Brazil",
};