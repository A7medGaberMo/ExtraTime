/**
 * Pure Squad Draft Match Simulator
 *
 * Zero I/O — runs identically client-side and inside Convex backend.
 * Poisson xG model driven by line strengths scaled by squad chemistry
 * (Total OVR + Chem Bonus per the Master Architecture Plan).
 *
 * - GK is folded into the DEF line (a Bronze GK vs an Icon GK must differ).
 * - Draws resolve via penalty shootout for competitive duels; otherwise
 *   a draw is a draw, like real football.
 */

import { hashSeed, mulberry32 } from "./match-simulator";

export interface SimSlot {
  line: "GK" | "DEF" | "MID" | "ATT";
  /** Synthetic OVR of the card placed here. */
  ovr: number;
  /** Position fitness factor: 1.0 exact / 0.8 natural variant / 0.0 mismatch. */
  fitFactor: number;
}

export interface SimTeamPowers {
  attack: number;
  midfield: number;
  defense: number;
  totalOvr: number;
  chemBonus: number; // 0..1 (team chemistry out of 33)
}

export interface SquadDraftSimResult {
  score: { host: number; guest: number };
  winner: "host" | "guest" | "draw";
  xG: { host: number; guest: number };
  possession: { host: number; guest: number };
  powers: { host: SimTeamPowers; guest: SimTeamPowers };
  shootout?: { winner: "host" | "guest"; score: { host: number; guest: number } };
}

const LEAGUE_AVG_GOALS = 1.35;
const CHEM_POWER_WEIGHT = 0.35;

/** Knuth's Poisson sampler: count of uniform draws until product < e^-λ. */
export function poissonSample(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function lineStrength(slots: SimSlot[], line: "DEF" | "MID" | "ATT"): { sum: number; count: number } {
  let sum = 0;
  let count = 0;
  for (const slot of slots) {
    if (slot.line === line || (line === "DEF" && slot.line === "GK")) {
      sum += slot.ovr * slot.fitFactor; // out-of-position cards are heavily reduced
      count++;
    }
  }
  return { sum, count };
}

function analyzeTeam(slots: SimSlot[], chemBonus: number): SimTeamPowers {
  const def = lineStrength(slots, "DEF");
  const mid = lineStrength(slots, "MID");
  const att = lineStrength(slots, "ATT");
  const chemScale = 1 + CHEM_POWER_WEIGHT * chemBonus;
  const avg = (s: { sum: number; count: number }) => (s.count > 0 ? s.sum / s.count : 55);
  const totalOvr = slots.reduce((sum, s) => sum + s.ovr, 0);
  return {
    attack: avg(att) * chemScale,
    midfield: avg(mid) * chemScale,
    defense: avg(def) * chemScale,
    totalOvr,
    chemBonus,
  };
}

function gkOvr(slots: SimSlot[]): number {
  const gk = slots.find((s) => s.line === "GK");
  return gk ? gk.ovr * gk.fitFactor : 55;
}

function shooters(slots: SimSlot[]): number[] {
  return slots
    .filter((s) => s.line !== "GK")
    .map((s) => s.ovr * s.fitFactor)
    .sort((a, b) => b - a);
}

function penaltyProb(shooter: number, keeper: number): number {
  return Math.max(0.55, Math.min(0.92, 0.78 + (shooter - keeper) / 400));
}

/** 5-round alternating shootout with sudden death — used only for competitive draws. */
function penaltyShootout(
  hostSlots: SimSlot[],
  guestSlots: SimSlot[],
  rng: () => number
): { winner: "host" | "guest"; score: { host: number; guest: number } } {
  const hostList = shooters(hostSlots);
  const guestList = shooters(guestSlots);
  const hostGk = gkOvr(hostSlots);
  const guestGk = gkOvr(guestSlots);

  let hostScore = 0;
  let guestScore = 0;
  let hIdx = 0;
  let gIdx = 0;

  const kick = (side: "host" | "guest"): boolean => {
    if (side === "host") {
      const shooter = hostList[Math.min(hIdx++, hostList.length - 1)] ?? 70;
      return rng() < penaltyProb(shooter, guestGk);
    }
    const shooter = guestList[Math.min(gIdx++, guestList.length - 1)] ?? 70;
    return rng() < penaltyProb(shooter, hostGk);
  };

  const tally = (h: boolean, g: boolean) => {
    hostScore += h ? 1 : 0;
    guestScore += g ? 1 : 0;
  };

  const settled = (remaining: number): { winner: "host" | "guest"; score: { host: number; guest: number } } | null => {
    if (hostScore > guestScore + remaining) return { winner: "host", score: { host: hostScore, guest: guestScore } };
    if (guestScore > hostScore + remaining) return { winner: "guest", score: { host: hostScore, guest: guestScore } };
    return null;
  };

  for (let i = 0; i < 5; i++) {
    tally(kick("host"), kick("guest"));
    const done = settled(4 - i);
    if (done) return done;
  }

  let round = 0;
  while (hostScore === guestScore && round < 12) {
    tally(kick("host"), kick("guest"));
    round++;
  }

  return {
    winner: hostScore > guestScore ? "host" : "guest",
    score: { host: hostScore, guest: guestScore },
  };
}

/**
 * Deterministic match resolution from both squads' chemistry-annotated slots.
 * Same inputs → identical result: replay-safe and non-gameable.
 */
export function simulateSquadDraftMatch(
  hostSlots: SimSlot[],
  guestSlots: SimSlot[],
  chemHost: number, // 0..33
  chemGuest: number, // 0..33
  seed: string,
  shootoutOnDraw = false
): SquadDraftSimResult {
  const rng = mulberry32(hashSeed(seed));
  const rngPk = mulberry32(hashSeed(`${seed}::pk`));

  const hostPowers = analyzeTeam(hostSlots, clamp01(chemHost / 33));
  const guestPowers = analyzeTeam(guestSlots, clamp01(chemGuest / 33));

  // Possession from the midfield battle.
  const totalMid = hostPowers.midfield + guestPowers.midfield;
  const possessionHost = totalMid > 0 ? hostPowers.midfield / totalMid : 0.5;
  const possFactorHost = 0.7 + 0.6 * possessionHost;
  const possFactorGuest = 0.7 + 0.6 * (1 - possessionHost);

  // Expected goals from attack-vs-defense ratio and possession.
  const xGHost = LEAGUE_AVG_GOALS * (hostPowers.attack / (guestPowers.defense || 1)) * possFactorHost;
  const xGGuest = LEAGUE_AVG_GOALS * (guestPowers.attack / (hostPowers.defense || 1)) * possFactorGuest;

  const goalsHost = poissonSample(xGHost, rng);
  const goalsGuest = poissonSample(xGGuest, rng);

  let winner: "host" | "guest" | "draw" = "draw";
  if (goalsHost > goalsGuest) winner = "host";
  else if (goalsGuest > goalsHost) winner = "guest";

  let shootout: SquadDraftSimResult["shootout"];
  if (winner === "draw" && shootoutOnDraw) {
    const pk = penaltyShootout(hostSlots, guestSlots, rngPk);
    winner = pk.winner;
    shootout = pk;
  }

  return {
    score: { host: goalsHost, guest: goalsGuest },
    winner,
    xG: { host: xGHost, guest: xGGuest },
    possession: { host: possessionHost, guest: 1 - possessionHost },
    powers: { host: hostPowers, guest: guestPowers },
    ...(shootout ? { shootout } : {}),
  };
}