import { describe, it, expect } from "vitest";
import {
  getFormationGraph,
  getRoundOrder,
  roundCountFor,
  getNodeForRound,
  validateFormation,
  getAdjacentSlots,
  FORMATION_CODES,
  type FormationGraph,
} from "../convex/squadDraft/formationGraph";

describe("formation graph registry", () => {
  it("exposes expected formation codes", () => {
    expect(FORMATION_CODES.sort()).toEqual(["1-1-2", "1-2-1", "2-1-1", "3-5-2", "4-2-3-1", "4-3-3", "4-4-2"].sort());
  });

  it("has 4 elevens and 3 fives", () => {
    const graphs = FORMATION_CODES.map((c) => getFormationGraph(c)!);
    expect(graphs.filter((g) => g.matchSize === 11)).toHaveLength(4);
    expect(graphs.filter((g) => g.matchSize === 5)).toHaveLength(3);
  });

  for (const code of FORMATION_CODES) {
    describe(`graph ${code}`, () => {
      const graph = getFormationGraph(code)!;

      it("node count matches matchSize", () => {
        expect(graph.nodes).toHaveLength(graph.matchSize);
      });

      it("slot indexes are the exact set 0..n-1", () => {
        const indexes = graph.nodes.map((n) => n.slotIndex).sort((a, b) => a - b);
        expect(indexes).toEqual(graph.nodes.map((_, i) => i));
      });

      it("has exactly one GK", () => {
        expect(graph.nodes.filter((n) => n.position === "GK")).toHaveLength(1);
        expect(graph.nodes.filter((n) => n.line === "GK")).toHaveLength(1);
      });

      it("all edges reference existing node indexes", () => {
        const valid = new Set(graph.nodes.map((n) => n.slotIndex));
        for (const [a, b] of graph.edges) {
          expect(valid.has(a)).toBe(true);
          expect(valid.has(b)).toBe(true);
          expect(a).not.toBe(b);
        }
      });

      it("getAdjacentSlots is symmetric and complete", () => {
        for (const n of graph.nodes) {
          const adj = getAdjacentSlots(graph, n.slotIndex);
          expect(adj).toHaveLength(graph.edges.filter(([a, b]) => a === n.slotIndex || b === n.slotIndex).length);
        }
      });

      it("pitch coordinates stay inside 0..100", () => {
        for (const n of graph.nodes) {
          expect(n.x).toBeGreaterThanOrEqual(0);
          expect(n.x).toBeLessThanOrEqual(100);
          expect(n.y).toBeGreaterThanOrEqual(0);
          expect(n.y).toBeLessThanOrEqual(100);
        }
      });
    });
  }
});

describe("getRoundOrder", () => {
  it("drafts GK → DEF → MID → ATT with stable tie order", () => {
    const order = getRoundOrder("4-3-3");
    expect(order).toHaveLength(11);
    expect(order.map((r) => r.position)).toEqual(["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "LW", "ST", "RW"]);
    expect(order[0].position).toBe("GK");
    expect(order[1].position).toBe("LB");
  });

  it("rounds are numbered 1..n", () => {
    for (const code of FORMATION_CODES) {
      const order = getRoundOrder(code);
      expect(order.map((r) => r.round)).toEqual(order.map((_, i) => i + 1));
    }
  });

  it("getNodeForRound matches round order entries", () => {
    const order = getRoundOrder("4-4-2");
    for (const r of order) {
      expect(getNodeForRound("4-4-2", r.round)).toEqual({ position: r.position, slotIndex: r.slotIndex });
    }
  });

  it("throws on unknown formations", () => {
    expect(() => getRoundOrder("9-9-9")).toThrow();
    expect(() => getNodeForRound("4-3-3", 99)).toThrow();
    expect(() => validateFormation("bogus")).toThrow();
  });
});

describe("roundCountFor / validateFormation", () => {
  it("reports 11 and 5", () => {
    expect(roundCountFor("4-3-3")).toBe(11);
    expect(roundCountFor("1-1-2")).toBe(5);
  });

  it("accepts every registered code", () => {
    for (const code of FORMATION_CODES) expect(() => validateFormation(code)).not.toThrow();
  });

  it("rejects unknown codes", () => {
    for (const bad of ["", "4-3-2", "3-4-3", "💀"]) expect(() => roundCountFor(bad)).toThrow();
  });
});

describe("every node has draft-ready neighbours", () => {
  it("no isolated nodes in any formation", () => {
    for (const code of FORMATION_CODES) {
      const graph = getFormationGraph(code)!;
      for (const n of graph.nodes) {
        if (n.slotIndex === 0) continue; // GK may lean on 1-2 neighbours
        expect(getAdjacentSlots(graph, n.slotIndex).length).toBeGreaterThan(0);
      }
    }
  });
});