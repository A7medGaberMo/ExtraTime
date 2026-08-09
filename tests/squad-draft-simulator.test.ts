import { describe, it, expect } from "vitest";
import {
  simulateSquadDraftMatch,
  poissonSample,
  type SimSlot,
} from "../src/core/simulation/squad-draft-simulator";

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Full 11-a-side squad whose every card is ovr (attack slightly higher). */
function team(ovr: number): SimSlot[] {
  return [
    { line: "GK", ovr: ovr - 4, fitFactor: 1 },
    { line: "DEF", ovr, fitFactor: 1 },
    { line: "DEF", ovr, fitFactor: 1 },
    { line: "DEF", ovr, fitFactor: 1 },
    { line: "DEF", ovr, fitFactor: 1 },
    { line: "MID", ovr, fitFactor: 1 },
    { line: "MID", ovr, fitFactor: 1 },
    { line: "MID", ovr, fitFactor: 1 },
    { line: "ATT", ovr: ovr + 2, fitFactor: 1 },
    { line: "ATT", ovr: ovr + 2, fitFactor: 1 },
    { line: "ATT", ovr: ovr + 2, fitFactor: 1 },
  ];
}

describe("determinism", () => {
  it("same seed + squads → identical results", () => {
    const a = simulateSquadDraftMatch(team(85), team(80), 20, 15, "room:abc", true);
    const b = simulateSquadDraftMatch(team(85), team(80), 20, 15, "room:abc", true);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("different seeds give different outcomes", () => {
    let same = 0;
    for (let i = 0; i < 24; i++) {
      const a = simulateSquadDraftMatch(team(85), team(80), 20, 15, `s${i}`, true);
      const b = simulateSquadDraftMatch(team(85), team(80), 20, 15, `t${i}`, true);
      if (JSON.stringify(a) === JSON.stringify(b)) same++;
    }
    expect(same).toBeLessThan(24);
  });
});

describe("result physics", () => {
  it("possession always sums to 1", () => {
    for (let i = 0; i < 12; i++) {
      const r = simulateSquadDraftMatch(team(80 + i), team(70 + (i % 5)), 18, 12, `p${i}`, true);
      expect(r.possession.host + r.possession.guest).toBeCloseTo(1, 6);
    }
  });

  it("equal sides → balanced possession and xG", () => {
    const r = simulateSquadDraftMatch(team(85), team(85), 25, 25, "even", true);
    expect(Math.abs(r.possession.host - 0.5)).toBeLessThan(0.15);
    expect(Math.abs(r.xG.host - r.xG.guest)).toBeLessThan(0.3);
  });

  it("a stronger squad generates more xG and better powers", () => {
    const r = simulateSquadDraftMatch(team(92), team(62), 30, 0, "blowout", false);
    expect(r.xG.host).toBeGreaterThan(r.xG.guest * 1.8);
    expect(r.powers.host.attack).toBeGreaterThan(r.powers.guest.attack);
    expect(r.powers.host.defense).toBeGreaterThan(r.powers.guest.defense);
  });

  it("chemistry bonus scales midfield power", () => {
    const none = simulateSquadDraftMatch(team(85), team(85), 0, 0, "chem-none", false);
    const full = simulateSquadDraftMatch(team(85), team(85), 33, 33, "chem-full", false);
    expect(full.powers.host.midfield).toBeGreaterThan(none.powers.host.midfield);
  });

  it("scores are non-negative integers", () => {
    for (let i = 0; i < 20; i++) {
      const r = simulateSquadDraftMatch(team(70 + i), team(60 + i), 15, 15, `sc${i}`, true);
      expect(Number.isInteger(r.score.host)).toBe(true);
      expect(Number.isInteger(r.score.guest)).toBe(true);
      expect(r.score.host).toBeGreaterThanOrEqual(0);
      expect(r.score.guest).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("monte carlo dominance", () => {
  it("an elite team beats a flat side in the majority of seeds", () => {
    let hostWins = 0;
    let guestWins = 0;
    for (let i = 0; i < 300; i++) {
      const r = simulateSquadDraftMatch(team(92), team(66), 1, 0, `mc-${i}`, true);
      if (r.winner === "host") hostWins++;
      else if (r.winner === "guest") guestWins++;
    }
    expect(hostWins).toBeGreaterThan(guestWins * 2);
    expect(hostWins).toBeGreaterThan(150);
  });
});

describe("shootouts", () => {
  it("equal sides force many draws → all get resolved when enabled", () => {
    let draws = 0;
    for (let i = 0; i < 40; i++) {
      const r = simulateSquadDraftMatch(team(85), team(85), 25, 25, `pk-${i}`, true);
      if (r.shootout) {
        draws++;
        expect(r.shootout.winner).toBe(r.winner);
        expect(r.shootout.score.host + r.shootout.score.guest).toBeGreaterThan(0);
      }
    }
    expect(draws).toBeGreaterThan(0);
  });

  it("when shootout is disabled a draw stays a draw", () => {
    const r = simulateSquadDraftMatch(team(92), team(66), 0, 0, "no-pk", false);
    if (r.score.host === r.score.guest) {
      expect(r.winner).toBe("draw");
      expect(r.shootout).toBeUndefined();
    }
  });
});

describe("poisson sampling", () => {
  it("returns non-negative integers", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const k = poissonSample(1.35, rng);
      expect(Number.isInteger(k)).toBe(true);
      expect(k).toBeGreaterThanOrEqual(0);
    }
  });

  it("high lambda yields a larger mean than low lambda", () => {
    const mean = (lambda: number) => {
      const rng = mulberry32(999);
      let total = 0;
      for (let i = 0; i < 3000; i++) total += poissonSample(lambda, rng);
      return total / 3000;
    };
    expect(mean(2.5)).toBeGreaterThan(mean(0.5));
  });

  it("zero lambda always returns zero", () => {
    for (let i = 0; i < 100; i++) {
      expect(poissonSample(0, mulberry32(i))).toBe(0);
    }
  });
});