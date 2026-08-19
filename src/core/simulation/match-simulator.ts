/**
 * Deterministic Tactical Match Simulator
 *
 * Pure math engine (zero imports, no I/O) so the SAME code runs
 * authoritatively in the Convex backend and can be unit-tested in isolation.
 *
 * Anti-exploit design:
 *  - Sector math (attack / midfield / defense) with natural-position accuracy fits.
 *  - Bounded chemistry: club link +1.5, nation link +1.0, hard cap +15.0 pts.
 *  - Diminishing budget discipline: +1.0 pt per $10M saved, cap +8.0 pts.
 *  - Midfield domination momentum bonus: +1.5 pts for the superior engine.
 *  - Every outcome is driven by deterministic PRNGs seeded from the room
 *    seed — identical input ALWAYS produces identical output everywhere.
 */

export type SimTier =
  | 'ICON'
  | 'HERO'
  | 'ULTIMATE'
  | 'MASTER'
  | 'ELITE'
  | 'GOLD'
  | 'SILVER'
  | 'BRONZE';

export interface SimPlayer {
  id: string;
  name: string;
  tier: SimTier;
  position: string;
  club: string;
  nation: string;
}

export type SimTimelineEventType =
  | 'KICKOFF'
  | 'GOAL'
  | 'SAVE'
  | 'CROSSBAR'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'HALF_TIME'
  | 'FULL_TIME'
  | 'PENALTY_SHOOTOUT';

export interface SimTimelineEvent {
  id: string;
  minute: number;
  type: SimTimelineEventType;
  team: 'host' | 'guest';
  player?: { id: string; name: string; tier: string; position: string };
  assistPlayer?: { id: string; name: string };
  description: string;
  scoreSnapshot: { host: number; guest: number };
}

export interface SimPlayerRating {
  playerId: string;
  name: string;
  position: string;
  tier: string;
  isSub: boolean;
  rating: number; // 6.0 - 10.0
  goals: number;
  assists: number;
  saves?: number;
}

export interface SimSectorAnalysis {
  attack: number;
  midfield: number;
  defense: number;
  totalRating: number;
}

export interface SimSynergyBreakdown {
  clubChemLinks: number;
  clubChemPoints: number;
  nationChemLinks: number;
  nationChemPoints: number;
  budgetBonusPoints: number;
  totalSynergyPoints: number;
}

export interface SimMatchResult {
  matchId: string;
  roomId: string;
  gameType: 'hidden_bid' | 'pack_opening_duel' | 'penalty_shootout';
  seed: string;
  score: { host: number; guest: number };
  winnerId: string | null; // null on draw
  isShootout: boolean;
  shootoutScore?: { host: number; guest: number };
  sectors: { host: SimSectorAnalysis; guest: SimSectorAnalysis };
  synergy: { host: SimSynergyBreakdown; guest: SimSynergyBreakdown };
  timeline: SimTimelineEvent[];
  playerRatings: { host: SimPlayerRating[]; guest: SimPlayerRating[] };
  generatedAt: number;
}

// ── Spec Constants ────────────────────────────────────────────────
export const TIER_WEIGHTS: Record<SimTier, number> = {
  ICON: 8.0,
  HERO: 7.0,
  ULTIMATE: 6.0,
  MASTER: 5.0,
  ELITE: 4.0,
  GOLD: 3.0,
  SILVER: 2.0,
  BRONZE: 1.0,
};

export const CHEM_CLUB_POINTS = 1.5;
export const CHEM_NATION_POINTS = 1.0;
export const CHEM_CAP = 15.0;
export const MIDFIELD_MOMENTUM_BONUS = 1.5;
export const MIDFIELD_MOMENTUM_THRESHOLD = 1.0;
export const BUDGET_BONUS_PER_10M = 1.0;
export const BUDGET_BONUS_CAP = 8.0;
export const HYBRID_POSITION_FIT = 0.9;
export const GK_ANCHOR_BONUS = 1.1;

type Line = 'GK' | 'DEF' | 'MID' | 'ATT';

function lineFor(raw: string): Line {
  const pos = raw.trim().toUpperCase();
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'ATT';
}

function playerLines(position: string): Set<Line> {
  const lines = new Set<Line>();
  for (const raw of position.split('/')) {
    const line = lineFor(raw.trim());
    if (line) lines.add(line);
  }
  return lines;
}

/** Natural-position accuracy: 1.0 for single-line specialists, 0.9 for hybrids. */
function positionFit(position: string): number {
  return playerLines(position).size <= 1 ? 1 : HYBRID_POSITION_FIT;
}

// ── Deterministic PRNG (FNV-1a hash + mulberry32) ────────────────
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Sector math ───────────────────────────────────────────────────
function computeSectors(squad: SimPlayer[]): Pick<SimSectorAnalysis, 'attack' | 'midfield' | 'defense'> {
  let attack = 0;
  let midfield = 0;
  let defense = 0;
  for (const p of squad) {
    const base = TIER_WEIGHTS[p.tier] ?? 1;
    const fit = positionFit(p.position);
    for (const line of playerLines(p.position)) {
      if (line === 'GK') {
        // Goalkeepers anchor ONLY the defense sector with a small bonus.
        defense += base * fit * GK_ANCHOR_BONUS;
      } else if (line === 'DEF') {
        defense += base * fit;
      } else if (line === 'MID') {
        midfield += base * fit;
      } else {
        attack += base * fit;
      }
    }
  }
  return { attack, midfield, defense };
}

function computeChemistry(squad: SimPlayer[]): SimSynergyBreakdown {
  let clubChemLinks = 0;
  let nationChemLinks = 0;
  for (let i = 0; i < squad.length; i++) {
    for (let j = i + 1; j < squad.length; j++) {
      if (squad[i].club && squad[i].club === squad[j].club) clubChemLinks++;
      if (squad[i].nation && squad[i].nation === squad[j].nation) nationChemLinks++;
    }
  }
  const clubChemPoints = Math.min(CHEM_CAP, clubChemLinks * CHEM_CLUB_POINTS);
  const nationChemPoints = Math.min(CHEM_CAP, nationChemLinks * CHEM_NATION_POINTS);
  const totalSynergyPoints = Math.min(CHEM_CAP, clubChemPoints + nationChemPoints);
  return {
    clubChemLinks,
    clubChemPoints,
    nationChemLinks,
    nationChemPoints,
    budgetBonusPoints: 0,
    totalSynergyPoints,
  };
}

/** Diminishing budget discipline: +1.0 pt per +10M saved, capped +8.0 pts. */
export function computeBudgetBonus(remainingBudget: number): number {
  if (!Number.isFinite(remainingBudget) || remainingBudget <= 0) return 0;
  return Math.min(BUDGET_BONUS_CAP, Math.floor(remainingBudget / 10) * BUDGET_BONUS_PER_10M);
}

export interface SimTeamAnalysis {
  attack: number;
  midfield: number;
  defense: number;
  chemistry: number;
  budgetBonus: number;
  momentumBonus: number;
  rating: number;
}

function analyzeTeam(squad: SimPlayer[], remainingBudget: number, midMomentumDiff: number): SimTeamAnalysis {
  const sectors = computeSectors(squad);
  const chemistry = computeChemistry(squad);
  const budgetBonus = computeBudgetBonus(remainingBudget);
  const momentumBonus =
    midMomentumDiff >= MIDFIELD_MOMENTUM_THRESHOLD ? MIDFIELD_MOMENTUM_BONUS : 0;
  const rating =
    sectors.attack +
    sectors.midfield +
    sectors.defense +
    chemistry.totalSynergyPoints +
    budgetBonus +
    momentumBonus;
  return {
    ...sectors,
    chemistry: chemistry.totalSynergyPoints,
    budgetBonus,
    momentumBonus,
    rating,
  };
}

/** Deterministic team analysis of both sides (symmetric momentum rule). */
export function analyzeTeamPair(
  hostSquad: SimPlayer[],
  guestSquad: SimPlayer[],
  hostBudget: number,
  guestBudget: number
): { host: SimTeamAnalysis; guest: SimTeamAnalysis } {
  const hostSectors = computeSectors(hostSquad);
  const guestSectors = computeSectors(guestSquad);
  const midDiff = hostSectors.midfield - guestSectors.midfield;
  return {
    host: analyzeTeam(hostSquad, hostBudget, midDiff),
    guest: analyzeTeam(guestSquad, guestBudget, -midDiff),
  };
}

function chemistryOf(squad: SimPlayer[], remainingBudget: number): SimSynergyBreakdown {
  const chem = computeChemistry(squad);
  const budgetBonusPoints = computeBudgetBonus(remainingBudget);
  // Keep chem and budget separate — matches analyzeTeam() rating composition.
  return {
    ...chem,
    budgetBonusPoints,
    totalSynergyPoints: chem.totalSynergyPoints,
  };
}

// ── Helpers ───────────────────────────────────────────────────────
function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T | null {
  if (items.length === 0) return null;
  const total = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= Math.max(0, weights[i]);
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function pickScorer(rng: () => number, squad: SimPlayer[]): SimPlayer | null {
  const attackers = squad.filter((p) => playerLines(p.position).has('ATT'));
  const mids = squad.filter((p) => playerLines(p.position).has('MID'));
  const pool = attackers.length >= 2 ? attackers : [...attackers, ...mids];
  const weights = pool.map((p) => (TIER_WEIGHTS[p.tier] ?? 1) * 2 + 1);
  return pickWeighted(rng, pool, weights);
}

function pickRandom(rng: () => number, squad: SimPlayer[]): SimPlayer | null {
  const weights = squad.map((p) => (TIER_WEIGHTS[p.tier] ?? 1) + 0.5);
  return pickWeighted(rng, squad, weights);
}

function pickGoalkeeper(squad: SimPlayer[]): SimPlayer | null {
  return squad.find((p) => playerLines(p.position).has('GK')) ?? null;
}

const GOAL_DESCRIPTIONS = [
  'THUNDER STRIKE from {name}! Unleashed top-corner from range!',
  '{name} finishes clinically after a slick passing move!',
  'WHAT A GOAL! {name} beats the keeper with a first-time finish!',
  '{name} rises highest and powers the header home!',
  'SILKY FINISH! {name} curls it into the far corner!',
  '{name} slots it coolly past the keeper — textbook!',
];

const ASSIST_PREFIXES = [
  'a brilliant through ball',
  'a perfect cutback',
  'an inch-perfect cross',
  'a defence-splitting pass',
];

const CROSSBAR_DESCRIPTIONS = [
  '{name} rattles the CROSSBAR! The woodwork denies them!',
  'So close! {name} clips the top of the bar!',
];

const SAVE_DESCRIPTIONS = [
  '{gk} makes a reaction save to deny {name}!',
  'INCREDIBLE SAVE! {gk} spreads wide to stop {name}!',
  '{gk} dives low and claws away {name}\'s effort!',
];

const YELLOW_DESCRIPTIONS = [
  '{name} goes into the book for a tactical foul.',
  '{name} is cautioned — late challenge in midfield.',
  'Yellow card! {name} brings down a counter-attack.',
];

const RED_DESCRIPTIONS = [
  'RED CARD! {name} is sent off for a studs-up challenge!',
  'Straight red for {name} — a reckless stamp!',
];

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

// ── Ratings ───────────────────────────────────────────────────────
interface SideStats {
  goals: number;
  assists: number;
  saves: number;
}

function computeRatingsFor(
  squad: SimPlayer[],
  stats: Map<string, SideStats>,
  rng: () => number
): SimPlayerRating[] {
  return squad.map((p) => {
    const s = stats.get(p.id) ?? { goals: 0, assists: 0, saves: 0 };
    const tierWeight = TIER_WEIGHTS[p.tier] ?? 1;
    const isGk = playerLines(p.position).has('GK');
    let rating =
      6.2 +
      tierWeight * 0.35 +
      s.goals * 0.9 +
      s.assists * 0.35 +
      s.saves * (isGk ? 0.25 : 0.1) +
      (rng() - 0.5) * 0.5;
    rating = Math.min(10, Math.max(6, rating));
    return {
      playerId: p.id,
      name: p.name,
      position: p.position,
      tier: p.tier,
      isSub: false,
      rating: Math.round(rating * 10) / 10,
      goals: s.goals,
      assists: s.assists,
      ...(s.saves > 0 ? { saves: s.saves } : {}),
    };
  });
}

// ── Main entry ────────────────────────────────────────────────────
export interface SimulateOptions {
  matchId?: string;
  gameType?: SimMatchResult['gameType'];
  hostUserId?: string;
  guestUserId?: string;
}

export function simulateTacticalMatch(
  roomId: string,
  hostSquad: SimPlayer[],
  guestSquad: SimPlayer[],
  hostBudget: number,
  guestBudget: number,
  seed: string,
  options: SimulateOptions = {}
): SimMatchResult {
  const rng = mulberry32(hashSeed(`${seed}:${roomId}`));
  const flowRng = mulberry32(hashSeed(`${seed}:${roomId}::flow`));
  const matchId = options.matchId ?? `sim-${hashSeed(`${roomId}:${seed}`).toString(36)}`;
  const gameType = options.gameType ?? 'hidden_bid';

  const { host: hostAnalysis, guest: guestAnalysis } = analyzeTeamPair(
    hostSquad,
    guestSquad,
    hostBudget,
    guestBudget
  );

  // Expected goals from the rating gap, scaled into a credible 90-minute band.
  const gap = hostAnalysis.rating - guestAnalysis.rating;
  const xgHost = Math.min(4.2, Math.max(0.35, 1.62 + gap * 0.024));
  const xgGuest = Math.min(4.2, Math.max(0.35, 1.62 - gap * 0.024));

  const timeline: SimTimelineEvent[] = [];
  const score = { host: 0, guest: 0 };
  const stats = new Map<string, SideStats>();

  function bump(id: string, key: 'goals' | 'assists' | 'saves') {
    const entry = stats.get(id) ?? { goals: 0, assists: 0, saves: 0 };
    entry[key]++;
    stats.set(id, entry);
  }

  function pushEvent(
    minute: number,
    type: SimTimelineEventType,
    team: 'host' | 'guest',
    description: string,
    player?: SimTimelineEvent['player'],
    assistPlayer?: SimTimelineEvent['assistPlayer'],
    snapshot?: { host: number; guest: number }
  ) {
    timeline.push({
      id: `${minute}-${type.toLowerCase()}-${timeline.length}`,
      minute,
      type,
      team,
      player,
      assistPlayer,
      description,
      scoreSnapshot: snapshot ?? { host: score.host, guest: score.guest },
    });
  }

  const sideSquad = (side: 'host' | 'guest'): SimPlayer[] => (side === 'host' ? hostSquad : guestSquad);

  const cardUser = (p: SimPlayer): SimTimelineEvent['player'] => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    position: p.position,
  });

  function doGoal(minute: number, side: 'host' | 'guest') {
    const squad = sideSquad(side);
    const scorer = pickScorer(rng, squad) ?? pickRandom(rng, squad) ?? squad[0];
    const assistPool = squad.filter((p) => p.id !== scorer.id);
    const assist =
      assistPool.length > 0 && rng() < 0.72
        ? pickRandom(rng, assistPool)
        : null;
    score[side]++;
    bump(scorer.id, 'goals');
    if (assist) bump(assist.id, 'assists');
    const description = fill(pick(rng, GOAL_DESCRIPTIONS), { name: scorer.name });
    pushEvent(
      minute,
      'GOAL',
      side,
      assist
        ? `${description} (${pick(rng, ASSIST_PREFIXES)} from ${assist.name})`
        : description,
      cardUser(scorer),
      assist ? { id: assist.id, name: assist.name } : undefined
    );
  }

  function doSave(minute: number, side: 'host' | 'guest') {
    const defending = sideSquad(side);
    const attacking = sideSquad(side === 'host' ? 'guest' : 'host');
    const gk = pickGoalkeeper(defending) ?? pickRandom(rng, defending) ?? defending[0];
    const attacker = pickScorer(rng, attacking) ?? pickRandom(rng, attacking) ?? attacking[0];
    bump(gk.id, 'saves');
    pushEvent(
      minute,
      'SAVE',
      side,
      fill(pick(rng, SAVE_DESCRIPTIONS), { gk: gk.name, name: attacker.name }),
      cardUser(gk),
      attacker ? { id: attacker.id, name: attacker.name } : undefined
    );
  }

  function doCrossbar(minute: number, side: 'host' | 'guest') {
    const squad = sideSquad(side);
    const attacker = pickRandom(rng, squad) ?? squad[0];
    pushEvent(
      minute,
      'CROSSBAR',
      side,
      fill(pick(rng, CROSSBAR_DESCRIPTIONS), { name: attacker.name }),
      cardUser(attacker)
    );
  }

  function doCard(minute: number, side: 'host' | 'guest', kind: 'YELLOW_CARD' | 'RED_CARD') {
    const squad = sideSquad(side);
    const player = pickRandom(rng, squad) ?? squad[0];
    const pool = kind === 'YELLOW_CARD' ? YELLOW_DESCRIPTIONS : RED_DESCRIPTIONS;
    pushEvent(minute, kind, side, fill(pick(rng, pool), { name: player.name }), cardUser(player));
  }

  // ── KICKOFF marker ──
  pushEvent(0, 'KICKOFF', 'host', 'The whistle blows — the Hidden Bid derby is underway!');

  let minute = 1;
  while (minute <= 90) {
    // Late-game goals are more likely (excitement-weighted).
    const minuteBias = 0.45 + (minute / 90) * 0.7;
    const pHost = (xgHost / 90) * minuteBias;
    const pGuest = (xgGuest / 90) * minuteBias;

    const roll = flowRng();
    if (roll < pHost) {
      doGoal(minute, 'host');
    } else if (roll < pHost + pGuest) {
      doGoal(minute, 'guest');
    } else if (roll > 1 - 0.06) {
      doSave(minute, roll > 1 - 0.03 ? 'host' : 'guest');
    } else if (roll > 1 - 0.09) {
      doCrossbar(minute, roll > 1 - 0.045 ? 'host' : 'guest');
    } else if (roll < 0.011) {
      doCard(minute, roll < 0.0055 ? 'host' : 'guest', 'YELLOW_CARD');
    } else if (roll < 0.015) {
      doCard(minute, roll < 0.0075 ? 'host' : 'guest', 'RED_CARD');
    }

    if (minute === 45) {
      pushEvent(45, 'HALF_TIME', 'host', `HALF-TIME — ${score.host}-${score.guest}`);
    }
    minute++;
  }

  pushEvent(90, 'FULL_TIME', 'host', `FULL TIME — ${score.host}-${score.guest}`);

  // ── Penalty shootout on a draw ──
  let isShootout = false;
  let shootoutScore: { host: number; guest: number } | undefined;
  let winnerId: string | null = null;

  if (score.host === score.guest) {
    isShootout = true;
    const hostShooters = [...hostSquad]
      .filter((p) => !playerLines(p.position).has('GK'))
      .sort((a, b) => (TIER_WEIGHTS[b.tier] ?? 1) - (TIER_WEIGHTS[a.tier] ?? 1))
      .slice(0, 11);
    const guestShooters = [...guestSquad]
      .filter((p) => !playerLines(p.position).has('GK'))
      .sort((a, b) => (TIER_WEIGHTS[b.tier] ?? 1) - (TIER_WEIGHTS[a.tier] ?? 1))
      .slice(0, 11);
    const hostGk = pickGoalkeeper(hostSquad);
    const guestGk = pickGoalkeeper(guestSquad);

    const pkScore = { host: 0, guest: 0 };
    const shootoutEvents: SimTimelineEvent[] = [];
    const pkPush = (
      kick: number,
      side: 'host' | 'guest',
      desc: string,
      player: SimPlayer,
      snap: { host: number; guest: number }
    ) => {
      const minutePk = 91 + Math.floor(kick / 2);
      shootoutEvents.push({
        id: `${minutePk}-penalty-${kick}`,
        minute: minutePk,
        type: 'PENALTY_SHOOTOUT',
        team: side,
        player: cardUser(player),
        description: desc,
        scoreSnapshot: { host: snap.host, guest: snap.guest },
      });
    };

    const kickOne = (kick: number, side: 'host' | 'guest', shooter: SimPlayer): boolean => {
      const converted =
        side === 'host'
          ? convertPenalty(rng, shooter, guestGk, hostAnalysis.attack, guestAnalysis.defense)
          : convertPenalty(rng, shooter, hostGk, guestAnalysis.attack, hostAnalysis.defense);
      if (converted) pkScore[side]++;
      const snap = { host: pkScore.host, guest: pkScore.guest };
      pkPush(
        kick,
        side,
        converted
          ? `${shooter.name} BURIES the penalty! (${pkScore.host}-${pkScore.guest})`
          : `${shooter.name} MISSES from the spot! (${pkScore.host}-${pkScore.guest})`,
        shooter,
        snap
      );
      return converted;
    };

    // Regulation 5-round shootout (10 kicks, host first)
    let kick = 0;
    for (let round = 0; round < 5 && kick < 10; round++) {
      kickOne(kick++, 'host', hostShooters[round % hostShooters.length] ?? hostSquad[0]);
      kickOne(kick++, 'guest', guestShooters[round % guestShooters.length] ?? guestSquad[0]);
    }

    // Sudden death until the first split decision (capped at 14 extra kicks)
    let sudden = 0;
    while (pkScore.host === pkScore.guest && sudden < 7) {
      const hShot = kickOne(kick++, 'host', hostShooters[5 + sudden] ?? hostShooters[0]);
      const gShot = kickOne(kick++, 'guest', guestShooters[5 + sudden] ?? guestShooters[0]);
      if (hShot !== gShot) break;
      sudden++;
    }

    shootoutScore = { host: pkScore.host, guest: pkScore.guest };
    timeline.push(...shootoutEvents);

    if (pkScore.host !== pkScore.guest) {
      winnerId =
        pkScore.host > pkScore.guest ? (options.hostUserId ?? null) : (options.guestUserId ?? null);
    }
  } else {
    winnerId = score.host > score.guest ? (options.hostUserId ?? null) : (options.guestUserId ?? null);
  }

  const ratings = {
    host: computeRatingsFor(hostSquad, stats, rng),
    guest: computeRatingsFor(guestSquad, stats, rng),
  };

  return {
    matchId,
    roomId,
    gameType,
    seed,
    score: { host: score.host, guest: score.guest },
    winnerId,
    isShootout,
    shootoutScore,
    sectors: {
      host: {
        attack: hostAnalysis.attack,
        midfield: hostAnalysis.midfield,
        defense: hostAnalysis.defense,
        totalRating: hostAnalysis.rating,
      },
      guest: {
        attack: guestAnalysis.attack,
        midfield: guestAnalysis.midfield,
        defense: guestAnalysis.defense,
        totalRating: guestAnalysis.rating,
      },
    },
    synergy: {
      host: chemistryOf(hostSquad, hostBudget),
      guest: chemistryOf(guestSquad, guestBudget),
    },
    timeline: [...timeline].sort((a, b) => a.minute - b.minute || a.id.localeCompare(b.id)),
    playerRatings: ratings,
    generatedAt: Date.now(),
  };
}

function convertPenalty(
  rng: () => number,
  shooter: SimPlayer,
  keeper: SimPlayer | null,
  attackStrength: number,
  defenseStrength: number
): boolean {
  const diff = attackStrength - defenseStrength;
  let p = 0.74 + (TIER_WEIGHTS[shooter.tier] ?? 1) * 0.012 + diff * 0.004;
  if (keeper) p -= 0.05;
  p = Math.min(0.92, Math.max(0.45, p));
  return rng() < p;
}
