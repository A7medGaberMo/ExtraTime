import { describe, it, expect } from "vitest";
import {
  getPositionMatch,
  getSyntheticOVR,
  calculateSquadChemistry,
  solveJokerWildcards,
  type ChemPlayerInput,
  type FormationSlotInput,
  type ChemistryResult,
} from "../src/core/chemistry/chemistryEngine";

const NODES_4_3_3: FormationSlotInput = {
  nodes: [
    { slotIndex: 0, position: "GK", line: "GK" },
    { slotIndex: 1, position: "LB", line: "DEF" },
    { slotIndex: 2, position: "CB", line: "DEF" },
    { slotIndex: 3, position: "CB", line: "DEF" },
    { slotIndex: 4, position: "RB", line: "DEF" },
    { slotIndex: 5, position: "CDM", line: "MID" },
    { slotIndex: 6, position: "CM", line: "MID" },
    { slotIndex: 7, position: "CM", line: "MID" },
    { slotIndex: 8, position: "LW", line: "ATT" },
    { slotIndex: 9, position: "ST", line: "ATT" },
    { slotIndex: 10, position: "RW", line: "ATT" },
  ],
  edges: [],
};

function card(
  id: string,
  position: string,
  extra: Partial<ChemPlayerInput> = {}
): ChemPlayerInput {
  return {
    id,
    position,
    tier: "GOLD",
    clubKey: "clubA",
    clubName: "Same Club",
    nationKey: "natA",
    nationName: "Same Nation",
    leagueKey: "leagueA",
    isLegend: false,
    isHeroFlag: false,
    isJoker: false,
    ...extra,
  };
}

const SQUAD_433_POSITIONS = ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "LW", "ST", "RW"];

function squad433(overrides: Array<[number, Partial<ChemPlayerInput>]> = []): ChemPlayerInput[] {
  const rows = SQUAD_433_POSITIONS.map((position, i) => card(`p${i}`, position));
  for (const [i, patch] of overrides) rows[i] = { ...rows[i], ...patch };
  return rows;
}

describe("getPositionMatch", () => {
  it("EXACT_MATCH for the same position", () => {
    expect(getPositionMatch("CB", "CB")).toBe("EXACT_MATCH");
    expect(getPositionMatch("ST", "ST")).toBe("EXACT_MATCH");
    expect(getPositionMatch("GK", "GK")).toBe("EXACT_MATCH");
  });

  it("NATURAL_VARIANT for every documented variant pair, both directions", () => {
    const pairs: Array<[string, string]> = [
      ["LB", "LWB"], ["LWB", "LB"],
      ["RB", "RWB"], ["RWB", "RB"],
      ["ST", "CF"], ["CF", "ST"],
      ["CM", "CAM"], ["CAM", "CM"],
      ["LW", "LM"], ["LM", "LW"],
      ["RW", "RM"], ["RM", "RW"],
    ];
    for (const [cardPos, slotPos] of pairs) {
      expect(getPositionMatch(cardPos, slotPos)).toBe("NATURAL_VARIANT");
    }
  });

  it("MISMATCH for foreign positions", () => {
    expect(getPositionMatch("ST", "GK")).toBe("MISMATCH");
    expect(getPositionMatch("GK", "CB")).toBe("MISMATCH");
    expect(getPositionMatch("CM", "ST")).toBe("MISMATCH");
    expect(getPositionMatch("LW", "CB")).toBe("MISMATCH");
  });

  it("normalizes case and slashes for multi-position cards", () => {
    expect(getPositionMatch("cdm/cm", "CM")).toBe("EXACT_MATCH");
    expect(getPositionMatch("CDM/CM", "CDM")).toBe("EXACT_MATCH");
    expect(getPositionMatch("CM/CDM", "CAM")).toBe("NATURAL_VARIANT");
    expect(getPositionMatch("CM/CDM", "ST")).toBe("MISMATCH");
  });
});

describe("synthetic OVR bands", () => {
  const order = ["ICON", "MASTER", "ELITE_PLUS", "ELITE", "HERO", "GOLD", "SILVER", "BRONZE"] as const;

  it("is strictly ordered high → low", () => {
    for (let i = 0; i < order.length - 1; i++) {
      expect(getSyntheticOVR(order[i])).toBeGreaterThan(getSyntheticOVR(order[i + 1]));
    }
  });

  it("sits in the planned bands", () => {
    expect(getSyntheticOVR("ICON")).toBe(92);
    expect(getSyntheticOVR("HERO")).toBe(85);
    expect(getSyntheticOVR("GOLD")).toBe(82);
    expect(getSyntheticOVR("BRONZE")).toBe(68);
  });
});

describe("calculateSquadChemistry — full 4-3-3", () => {
  it("max chemistry 33/33 with every card in position and shared links", () => {
    const result = calculateSquadChemistry(squad433(), NODES_4_3_3);
    expect(result.players).toHaveLength(11);
    expect(result.totalChem).toBe(33);
    for (const r of result.players) {
      expect(r.chem).toBe(3);
      expect(r.positionFit).toBe("EXACT_MATCH");
    }
  });

  it("totalOvr equals 11 × GOLD synthetic OVR", () => {
    const result = calculateSquadChemistry(squad433(), NODES_4_3_3);
    expect(result.totalOvr).toBe(11 * getSyntheticOVR("GOLD"));
  });

  it("ICON / HERO cards auto-max at 3/3 from any club", () => {
    const withIcon = calculateSquadChemistry(
      squad433([[9, { tier: "ICON", isLegend: true, clubKey: "zz" }]]),
      NODES_4_3_3
    );
    expect(withIcon.players[9].chem).toBe(3);
    expect(withIcon.players[9].isAutoMaxed).toBe(true);

    const withHero = calculateSquadChemistry(
      squad433([[7, { tier: "HERO", isHeroFlag: true, clubKey: "zz" }]]),
      NODES_4_3_3
    );
    expect(withHero.players[7].chem).toBe(3);
    expect(withHero.players[7].isAutoMaxed).toBe(true);
  });
});

describe("out-of-position behaviour", () => {
  it("a striker squeezed into goal gets 0 chem and MISMATCH", () => {
    const result = calculateSquadChemistry(squad433([[0, { position: "ST" }]]), NODES_4_3_3);
    expect(result.players[0].chem).toBe(0);
    expect(result.players[0].positionFit).toBe("MISMATCH");
    expect(result.players[0].fitnessFactor).toBe(0);
  });

  it("NATURAL_VARIANT caps chemistry at 2 with 0.8 fitness", () => {
    const result = calculateSquadChemistry(squad433([[7, { position: "CAM" }]]), NODES_4_3_3);
    const row = result.players[7];
    expect(row.positionFit).toBe("NATURAL_VARIANT");
    expect(row.fitnessFactor).toBe(0.8);
    expect(row.maxChem).toBe(2);
    expect(row.chem).toBeLessThanOrEqual(2);
  });

  it("an empty squad yields zeroes", () => {
    const result = calculateSquadChemistry([], NODES_4_3_3);
    expect(result.players).toHaveLength(0);
    expect(result.totalChem).toBe(0);
    expect(result.totalOvr).toBe(0);
  });
});

describe("link thresholds", () => {
  it("counts shared attributes per player", () => {
    const nodes2: FormationSlotInput = {
      nodes: [
        { slotIndex: 0, position: "GK", line: "GK" },
        { slotIndex: 1, position: "ST", line: "ATT" },
      ],
      edges: [],
    };
    const result = calculateSquadChemistry([card("a", "GK"), card("b", "ST")], nodes2);
    for (const r of result.players) {
      expect(r.clubCount).toBe(1);
      expect(r.nationCount).toBe(1);
      expect(r.leagueCount).toBe(1);
    }
  });

  it("a lone player gets no link points", () => {
    const node1: FormationSlotInput = { nodes: [{ slotIndex: 0, position: "GK", line: "GK" }], edges: [] };
    const result = calculateSquadChemistry([card("solo", "GK")], node1);
    expect(result.players[0].clubCount).toBe(0);
    expect(result.players[0].nationCount).toBe(0);
    expect(result.players[0].leagueCount).toBe(0);
  });
});

describe("Joker wildcards", () => {
  it("adopts an adjacent neighbor's club / nation / league", () => {
    const squad = [
      card("joker", "CM", { isJoker: true }),
      card("nn", "CM", {
        clubKey: "lfc", clubName: "Liverpool",
        nationKey: "bra", nationName: "Brazil",
        leagueKey: "PL",
      }),
      card("gk", "GK", { clubKey: "clubGK", nationKey: "natGK", leagueKey: "leagueGK" }),
      card("st", "ST", { clubKey: "clubST", nationKey: "natST", leagueKey: "leagueST" }),
    ];
    const formation: FormationSlotInput = {
      nodes: [
        { slotIndex: 0, position: "CM", line: "MID" },
        { slotIndex: 1, position: "CM", line: "MID" },
        { slotIndex: 2, position: "GK", line: "GK" },
        { slotIndex: 3, position: "ST", line: "ATT" },
      ],
      edges: [[0, 1], [1, 3], [0, 2]],
    };
    const resolutions = solveJokerWildcards(squad, formation);
    expect(resolutions).toHaveLength(1);
    const r = resolutions[0];
    expect(r.matchedNeighborPlayerId).toBe("nn");
    expect(r.adoptedClubKey).toBe("lfc");
    expect(r.adoptedNationKey).toBe("bra");
    expect(r.adoptedLeagueKey).toBe("PL");
  });

  it("reports no resolution when a joker has no adjacent neighbor", () => {
    const formation: FormationSlotInput = { nodes: [{ slotIndex: 0, position: "CM", line: "MID" }], edges: [] };
    const resolutions = solveJokerWildcards([card("joker", "CM", { isJoker: true })], formation);
    expect(resolutions).toHaveLength(0);
  });

  it("is deterministic", () => {
    const input = [
      card("nn", "CM", { clubKey: "lfc", nationKey: "bra", leagueKey: "PL" }),
      card("joker", "CM", { isJoker: true }),
    ];
    const fm: FormationSlotInput = {
      nodes: [
        { slotIndex: 0, position: "CM", line: "MID" },
        { slotIndex: 1, position: "CM", line: "MID" },
      ],
      edges: [[0, 1]],
    };
    expect(JSON.stringify(solveJokerWildcards(input, fm))).toBe(JSON.stringify(solveJokerWildcards(input, fm)));
    expect(JSON.stringify(calculateSquadChemistry(input, fm))).toBe(JSON.stringify(calculateSquadChemistry(input, fm)));
  });
});

describe("determinism", () => {
  it("same inputs → same chemistry every call", () => {
    const json = () => JSON.stringify(calculateSquadChemistry(squad433(), NODES_4_3_3));
    expect(json()).toBe(json());
  });
});