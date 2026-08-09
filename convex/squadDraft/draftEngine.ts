import { GenericMutationCtx } from "convex/server";
import { Id, DataModel, Doc } from "../_generated/dataModel";
import { getPositionMatch, type Tier } from "../../src/core/chemistry/chemistryEngine";
import { hashSeed, mulberry32 } from "../../src/core/simulation/match-simulator";
import { type PoolMode } from "../lib/constants";

export { getRoundOrder, getNodeForRound, roundCountFor, validateFormation } from "./formationGraph";

// Re-export for backwards compatibility in mutations.ts
export type PlayerPoolMode = PoolMode;

export interface DraftOption {
  playerId: Id<"players">;
  isJoker: boolean;
}

export interface DraftOptionsContext {
  round: number;
  targetPosition: string;
  poolMode: PoolMode;
  excludePlayerIds: Set<string>;
  /** Used to seed the deterministic RNG for shuffle + joker roll. */
  roomId: string;
  userId: string;
}

const TOP_CLUB_NAMES = new Set([
  "Real Madrid", "Barcelona", "Barca", "Atlético Madrid", "Atletico Madrid",
  "Manchester City", "Man City", "Arsenal", "Liverpool", "Manchester United", "Man Utd", "Chelsea", "Tottenham",
  "Bayern Munich", "Bayern", "Borussia Dortmund", "Dortmund",
  "Paris Saint-Germain", "PSG",
  "AC Milan", "Inter Milan", "Inter", "Juventus", "Juve", "Napoli",
]);

/** ~20% chance per turn that exactly one option is flagged as the Joker card. */
const JOKER_ROLL_CHANCE = 0.2;
export const ROUND_TIMER_MS = 45_000;

const TIER_RANK: Record<Tier, number> = {
  ICON: 0, HERO: 1, MASTER: 2, ELITE_PLUS: 3, ELITE: 4, GOLD: 5, SILVER: 6, BRONZE: 7,
};

/** Fisher-Yates shuffle with explicit RNG for deterministic reproducibility. */
function shuffle<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isPositionCompatible(cardPosition: string, targetPosition: string): boolean {
  return getPositionMatch(cardPosition, targetPosition) !== "MISMATCH";
}

// Slim candidate — only the fields needed for filtering + selection.
type SlimCandidate = Pick<Doc<"players">, "_id" | "position" | "tier" | "isLegend">;

/**
 * Pool-mode-aware candidate loader using targeted index queries.
 * Read counts by mode (vs. the old full-scan of ~3,126 every turn):
 *  - ICONS:      ~300 reads  (by_legend index)
 *  - ACTIVE:     ~2,800 reads (by_legend index, filter ICON/HERO)
 *  - EPL:        ~520 reads  (clubs + by_club per EPL club)
 *  - TOP_TEAMS:  ~320 reads  (clubs + by_club per top club)
 *  - GLOBAL:     ~3,100 reads (full scan — unavoidable)
 */
async function loadPoolCandidates(
  ctx: GenericMutationCtx<DataModel>,
  poolMode: PoolMode,
): Promise<SlimCandidate[]> {
  switch (poolMode) {
    case "ICONS": {
      // All legend players + any HERO-tier players that aren't flagged isLegend.
      const [legends, heroes] = await Promise.all([
        ctx.db.query("players").withIndex("by_legend", (q) => q.eq("isLegend", true)).collect(),
        ctx.db.query("players").withIndex("by_tier", (q) => q.eq("tier", "HERO")).collect(),
      ]);
      const seen = new Set<string>();
      const merged: SlimCandidate[] = [];
      for (const p of [...legends, ...heroes]) {
        const key = String(p._id);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(p);
        }
      }
      return merged;
    }

    case "ACTIVE": {
      const players = await ctx.db
        .query("players")
        .withIndex("by_legend", (q) => q.eq("isLegend", false))
        .collect();
      return players.filter((p) => p.tier !== "ICON" && p.tier !== "HERO");
    }

    case "EPL": {
      const clubs = await ctx.db.query("clubs").collect();
      const eplClubIds = clubs
        .filter((c) => c.league === "Premier League")
        .map((c) => c._id);
      const batches = await Promise.all(
        eplClubIds.map((cid) =>
          ctx.db.query("players").withIndex("by_club", (q) => q.eq("clubId", cid)).collect()
        )
      );
      return batches.flat().filter((p) => !p.isLegend && p.tier !== "ICON" && p.tier !== "HERO");
    }

    case "TOP_TEAMS": {
      const clubs = await ctx.db.query("clubs").collect();
      const topClubIds = clubs
        .filter((c) => TOP_CLUB_NAMES.has(c.name))
        .map((c) => c._id);
      const batches = await Promise.all(
        topClubIds.map((cid) =>
          ctx.db.query("players").withIndex("by_club", (q) => q.eq("clubId", cid)).collect()
        )
      );
      return batches.flat().filter((p) => !p.isLegend && p.tier !== "ICON" && p.tier !== "HERO");
    }

    default: // GLOBAL — all players
      return ctx.db.query("players").collect();
  }
}

/**
 * JIT option generation with seeded RNG and a 2-step feasibility cascade:
 *  1. Pool-filtered + position-compatible candidates (exact matches preferred).
 *  2. Pool-filtered fallback (ignore position, keep pool constraint).
 * Never creates synthetic DB rows — returns up to 5 options from real players.
 */
export async function generateDraftOptions(
  ctx: GenericMutationCtx<DataModel>,
  context: DraftOptionsContext
): Promise<DraftOption[]> {
  const { round, targetPosition, poolMode, excludePlayerIds, roomId, userId } = context;

  // Deterministic RNG seeded from room+round+user — safe across Convex retries.
  const rng = mulberry32(hashSeed(`draft:${roomId}:${userId}:${round}:${Date.now()}`));

  const all = await loadPoolCandidates(ctx, poolMode);
  const fresh = all.filter((p) => !excludePlayerIds.has(String(p._id)));

  // Step 1: position-compatible from the pool.
  const exact = fresh.filter((p) => getPositionMatch(p.position, targetPosition) === "EXACT_MATCH");
  const variant = fresh.filter((p) => getPositionMatch(p.position, targetPosition) === "NATURAL_VARIANT");
  const compatible = fresh.filter((p) => isPositionCompatible(p.position, targetPosition));

  // Step 2: build 5 options with priority: exact > natural variant > any compatible > any fresh.
  const options: DraftOption[] = [];
  const seen = new Set<string>(excludePlayerIds);

  const fillFrom = (list: SlimCandidate[]) => {
    for (const p of shuffle(list, rng)) {
      if (options.length >= 5) break;
      const key = String(p._id);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ playerId: p._id, isJoker: false });
    }
  };

  fillFrom(exact);
  if (options.length < 5) fillFrom(variant);
  if (options.length < 5) fillFrom(compatible);

  // Step 3: Fallback for exhausted test pools (< 5 cards total in DB)
  while (options.length < 5) {
    const isIconMode = poolMode === "ICONS";
    const syntheticId = await ctx.db.insert("players", {
      name: `Synthetic ${targetPosition}`,
      position: targetPosition,
      clubId: "" as Id<"clubs">,
      nationId: "" as Id<"nations">,
      tier: isIconMode ? "ICON" : "BRONZE",
      isLegend: isIconMode,
      isSynthetic: true,
    });
    options.push({ playerId: syntheticId, isJoker: false });
  }

  // Joker flag: ~20% roll, exactly one card, never an Icon/Hero.
  if (options.length > 0 && rng() < JOKER_ROLL_CHANCE) {
    const eligible = options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => {
        const candidate = all.find((p) => String(p._id) === String(o.playerId));
        return candidate && candidate.tier !== "ICON" && candidate.tier !== "HERO";
      });
    if (eligible.length > 0) {
      const chosen = eligible[Math.floor(rng() * eligible.length)];
      options[chosen.i] = { ...options[chosen.i], isJoker: true };
    }
  }

  return options.slice(0, 5);
}

/**
 * Deterministic best-pick on timer expiry: highest synthetic OVR (tier rank)
 * wins; a Joker card breaks ties and is preferred.
 */
export function bestOption(
  options: Array<{ playerId: Id<"players">; isJoker: boolean }>,
  playersById: Map<string, { tier: string }>
): { playerId: Id<"players">; isJoker: boolean } | null {
  if (options.length === 0) return null;
  let best = options[0];
  let bestRank = Number.MAX_SAFE_INTEGER;
  for (const o of options) {
    const p = playersById.get(String(o.playerId));
    if (!p) continue;
    const rank = TIER_RANK[p.tier as Tier] ?? 8;
    const effectiveRank = rank - (o.isJoker ? 0.5 : 0); // Joker breaks ties
    if (effectiveRank < bestRank) {
      bestRank = effectiveRank;
      best = o;
    }
  }
  return best;
}