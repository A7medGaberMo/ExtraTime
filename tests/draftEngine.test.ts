import { describe, it, expect } from "vitest";
import { FakeConvexDb, makeCtx } from "./fake-convex-db";
import { seedPlayerPool, DEFAULT_PLAYERS, type PlayerSeed } from "./fixtures/playerFixtures";
import { generateDraftOptions, bestOption, ROUND_TIMER_MS } from "../convex/squadDraft/draftEngine";
import { getPositionMatch } from "../src/core/chemistry/chemistryEngine";

function eplOnlyPool(): PlayerSeed[] {
  // Enough Premier League cards (with position variety) that mode pool alone
  // satisfies 5 picks — no global fallback.
  return DEFAULT_PLAYERS.filter((p) => (p.club ?? "lfc") === "lfc" || (p.club ?? "lfc") === "mci")
    .filter((p) => p.tier === "GOLD" || p.tier === "ELITE")
    .map((p) => ({ ...p, isLegend: false }));
}

function iconPool(): PlayerSeed[] {
  // 12 icon cards of varied positions — mode pool alone satisfies 5 picks.
  return (["ST", "ST", "ST", "ST", "CAM", "CM", "CDM", "CB", "CB", "LB", "RB", "GK"] as const).map(
    (position, i) => ({
      key: `icon-${i}`,
      name: `Icon ${i}`,
      position,
      tier: "ICON",
      isLegend: true,
    })
  );
}

describe("generateDraftOptions", () => {
  it("always returns exactly 5 unique options", async () => {
    const db = new FakeConvexDb();
    seedPlayerPool(db);
    const ctx = makeCtx(db);

    for (const round of [1, 3, 7, 9, 11]) {
      const options = await generateDraftOptions(ctx, {
        round,
        targetPosition: "ST",
        poolMode: "GLOBAL",
        excludePlayerIds: new Set(),
      });
      expect(options).toHaveLength(5);
      expect(new Set(options.map((o) => String(o.playerId))).size).toBe(5);
    }
  });

  it("excludes previously picked players", async () => {
    const db = new FakeConvexDb();
    const ids = seedPlayerPool(db);
    const ctx = makeCtx(db);
    const excluded = new Set([ids.players.stGoldA]);

    const options = await generateDraftOptions(ctx, {
      round: 1,
      targetPosition: "ST",
      poolMode: "GLOBAL",
      excludePlayerIds: excluded,
    });
    for (const o of options) {
      expect(String(o.playerId)).not.toBe(ids.players.stGoldA);
    }
  });

  it("only offers position-compatible cards for the target position", async () => {
    const db = new FakeConvexDb();
    seedPlayerPool(db);
    const ctx = makeCtx(db);

    const options = await generateDraftOptions(ctx, {
      round: 1,
      targetPosition: "GK",
      poolMode: "GLOBAL",
      excludePlayerIds: new Set(),
    });
    for (const o of options) {
      const player = await db.get(String(o.playerId));
      expect(player).not.toBeNull();
      expect(getPositionMatch(String(player!.position), "GK")).not.toBe("MISMATCH");
    }
  });

  it("EPL mode only draws Premier League non-legend cards", async () => {
    const db = new FakeConvexDb();
    const ids = seedPlayerPool(db, eplOnlyPool());
    const ctx = makeCtx(db);
    const leagueByClub = new Map<string, string>();
    for (const clubId of Object.values(ids.clubs)) {
      const club = await db.get(clubId);
      if (club) leagueByClub.set(String(clubId), String(club.league));
    }

    const options = await generateDraftOptions(ctx, {
      round: 1,
      targetPosition: "ST",
      poolMode: "EPL",
      excludePlayerIds: new Set(),
    });
    for (const o of options) {
      const p = await db.get(String(o.playerId));
      expect(leagueByClub.get(String(p!.clubId))).toBe("Premier League");
      expect(p!.isLegend ?? false).toBe(false);
    }
  });

  it("ICONS mode only draws legend / ICON / HERO cards", async () => {
    const db = new FakeConvexDb();
    seedPlayerPool(db, iconPool());
    const ctx = makeCtx(db);

    const options = await generateDraftOptions(ctx, {
      round: 5,
      targetPosition: "ST",
      poolMode: "ICONS",
      excludePlayerIds: new Set(),
    });
    for (const o of options) {
      const p = await db.get(String(o.playerId));
      expect(p?.tier).toBe("ICON");
    }
  });

  it("falls back to synthetic BRONZE cards when the pool is exhausted", async () => {
    const db = new FakeConvexDb();
    seedPlayerPool(db, DEFAULT_PLAYERS.slice(0, 3).map((p) => ({ ...p, position: "ST" })));
    const ctx = makeCtx(db);

    const options = await generateDraftOptions(ctx, {
      round: 1,
      targetPosition: "ST",
      poolMode: "GLOBAL",
      excludePlayerIds: new Set(),
    });
    expect(options).toHaveLength(5);

    let sawSynthetic = false;
    for (const o of options) {
      const p = await db.get(String(o.playerId));
      if (p?.isSynthetic === true) {
        sawSynthetic = true;
        expect(p.position).toBe("ST");
        expect(p.tier).toBe("BRONZE");
      }
    }
    expect(sawSynthetic).toBe(true);
  });

  it("never flags ICON or HERO cards as Joker", async () => {
    const db = new FakeConvexDb();
    // Joker eligibility excludes ICON/HERO; an icon-only pool must yield zero flags.
    seedPlayerPool(db, iconPool());
    const ctx = makeCtx(db);

    for (let i = 0; i < 20; i++) {
      const options = await generateDraftOptions(ctx, {
        round: 1,
        targetPosition: "ST",
        poolMode: "GLOBAL",
        excludePlayerIds: new Set(),
      });
      for (const o of options) {
        const p = await db.get(String(o.playerId));
        if (o.isJoker) {
          expect(p?.tier).not.toBe("ICON");
          expect(p?.tier).not.toBe("HERO");
        }
      }
    }
  });
});

describe("bestOption (auto-place policy)", () => {
  it("returns null for an empty list", () => {
    expect(bestOption([], new Map())).toBeNull();
  });

  it("prefers the highest tier card", () => {
    const gold = { playerId: "p:1" as never, isJoker: false };
    const icon = { playerId: "p:2" as never, isJoker: false };
    const tiers = new Map([
      [String(gold.playerId), { tier: "GOLD" }],
      [String(icon.playerId), { tier: "ICON" }],
    ]);
    expect(bestOption([gold, icon], tiers)?.playerId).toBe(icon.playerId);
  });

  it("a Joker card beats every non-Joker of the same tier", () => {
    const plain = { playerId: "p:a" as never, isJoker: false };
    const jok = { playerId: "p:b" as never, isJoker: true };
    const tiers = new Map([
      [String(plain.playerId), { tier: "ELITE" }],
      [String(jok.playerId), { tier: "ELITE" }],
    ]);
    expect(bestOption([plain, jok], tiers)?.playerId).toBe(jok.playerId);
  });

  it("skips players missing from the lookup and survives unknown tiers", () => {
    const a = { playerId: "p:missing" as never, isJoker: false };
    const b = { playerId: "p:bronze" as never, isJoker: false };
    const tiers = new Map([[String(b.playerId), { tier: "BRONZE" }]]);
    expect(bestOption([a, b], tiers)?.playerId).toBe(b.playerId);
  });
});

describe("ROUND_TIMER_MS", () => {
  it("keeps the 45s planned turn length", () => {
    expect(ROUND_TIMER_MS).toBe(45_000);
  });
});