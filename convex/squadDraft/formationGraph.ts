import { type Position } from "../lib/constants";

/** A single pitch node: slot index, position, tactical line, and 2D pitch coords (0..100). */
export interface FormationNode {
  slotIndex: number;
  position: Position;
  line: "GK" | "DEF" | "MID" | "ATT";
  /** 0..100% pitch width (x) */
  x: number;
  /** 0..100% pitch length (y, 0 = own goal, 100 = opponent goal) */
  y: number;
}

/**
 * Formation topology: nodes + undirected adjacency edges.
 * Chemistry link points are computed across these edges.
 */
export interface FormationGraph {
  name: string;
  matchSize: 5 | 11;
  nodes: FormationNode[];
  edges: [number, number][];
}

const FORMATIONS: Record<string, FormationGraph> = {
  "4-3-3": {
    name: "4-3-3",
    matchSize: 11,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 8 },
      { slotIndex: 1, position: "LB", line: "DEF", x: 15, y: 28 },
      { slotIndex: 2, position: "CB", line: "DEF", x: 35, y: 25 },
      { slotIndex: 3, position: "CB", line: "DEF", x: 65, y: 25 },
      { slotIndex: 4, position: "RB", line: "DEF", x: 85, y: 28 },
      { slotIndex: 5, position: "CDM", line: "MID", x: 50, y: 45 },
      { slotIndex: 6, position: "CM", line: "MID", x: 32, y: 58 },
      { slotIndex: 7, position: "CM", line: "MID", x: 68, y: 58 },
      { slotIndex: 8, position: "LW", line: "ATT", x: 18, y: 78 },
      { slotIndex: 9, position: "ST", line: "ATT", x: 50, y: 82 },
      { slotIndex: 10, position: "RW", line: "ATT", x: 82, y: 78 },
    ],
    edges: [
      [0, 2], [0, 3], [1, 2], [2, 3], [3, 4],
      [1, 5], [2, 5], [3, 5], [4, 5], [5, 6], [5, 7],
      [6, 8], [6, 9], [7, 9], [7, 10],
      [8, 9], [9, 10],
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    matchSize: 11,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 8 },
      { slotIndex: 1, position: "LB", line: "DEF", x: 15, y: 28 },
      { slotIndex: 2, position: "CB", line: "DEF", x: 35, y: 25 },
      { slotIndex: 3, position: "CB", line: "DEF", x: 65, y: 25 },
      { slotIndex: 4, position: "RB", line: "DEF", x: 85, y: 28 },
      { slotIndex: 5, position: "LM", line: "MID", x: 15, y: 55 },
      { slotIndex: 6, position: "CM", line: "MID", x: 40, y: 52 },
      { slotIndex: 7, position: "CM", line: "MID", x: 60, y: 52 },
      { slotIndex: 8, position: "RM", line: "MID", x: 85, y: 55 },
      { slotIndex: 9, position: "ST", line: "ATT", x: 38, y: 80 },
      { slotIndex: 10, position: "ST", line: "ATT", x: 62, y: 80 },
    ],
    edges: [
      [0, 2], [0, 3], [1, 2], [2, 3], [3, 4],
      [1, 5], [2, 6], [3, 7], [4, 8],
      [5, 6], [6, 7], [7, 8],
      [6, 9], [7, 10],
      [9, 10],
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    matchSize: 11,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 8 },
      { slotIndex: 1, position: "LB", line: "DEF", x: 15, y: 28 },
      { slotIndex: 2, position: "CB", line: "DEF", x: 35, y: 25 },
      { slotIndex: 3, position: "CB", line: "DEF", x: 65, y: 25 },
      { slotIndex: 4, position: "RB", line: "DEF", x: 85, y: 28 },
      { slotIndex: 5, position: "CDM", line: "MID", x: 35, y: 45 },
      { slotIndex: 6, position: "CDM", line: "MID", x: 65, y: 45 },
      { slotIndex: 7, position: "CAM", line: "MID", x: 50, y: 60 },
      { slotIndex: 8, position: "LW", line: "ATT", x: 20, y: 75 },
      { slotIndex: 9, position: "RW", line: "ATT", x: 80, y: 75 },
      { slotIndex: 10, position: "ST", line: "ATT", x: 50, y: 82 },
    ],
    edges: [
      [0, 2], [0, 3], [1, 2], [2, 3], [3, 4],
      [1, 5], [2, 5], [3, 6], [4, 6],
      [5, 6], [5, 7], [6, 7], [7, 8], [7, 9], [7, 10],
      [8, 10], [9, 10],
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    matchSize: 11,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 8 },
      { slotIndex: 1, position: "CB", line: "DEF", x: 30, y: 25 },
      { slotIndex: 2, position: "CB", line: "DEF", x: 50, y: 22 },
      { slotIndex: 3, position: "CB", line: "DEF", x: 70, y: 25 },
      { slotIndex: 4, position: "LM", line: "MID", x: 12, y: 55 },
      { slotIndex: 5, position: "CDM", line: "MID", x: 35, y: 45 },
      { slotIndex: 6, position: "CM", line: "MID", x: 30, y: 62 },
      { slotIndex: 7, position: "CM", line: "MID", x: 70, y: 62 },
      { slotIndex: 8, position: "RM", line: "MID", x: 88, y: 55 },
      { slotIndex: 9, position: "ST", line: "ATT", x: 38, y: 80 },
      { slotIndex: 10, position: "CF", line: "ATT", x: 62, y: 80 },
    ],
    edges: [
      [0, 2], [1, 2], [2, 3],
      [1, 4], [1, 5], [2, 5], [3, 5], [3, 8],
      [4, 6], [5, 6], [5, 7], [8, 7], [6, 7],
      [6, 9], [7, 10],
      [9, 10],
    ],
  },
  "1-2-1": {
    name: "1-2-1",
    matchSize: 5,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 12 },
      { slotIndex: 1, position: "CB", line: "DEF", x: 50, y: 35 },
      { slotIndex: 2, position: "CM", line: "MID", x: 35, y: 60 },
      { slotIndex: 3, position: "CAM", line: "MID", x: 65, y: 60 },
      { slotIndex: 4, position: "ST", line: "ATT", x: 50, y: 85 },
    ],
    edges: [
      [0, 1], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4],
    ],
  },
  "2-1-1": {
    name: "2-1-1",
    matchSize: 5,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 12 },
      { slotIndex: 1, position: "CB", line: "DEF", x: 35, y: 32 },
      { slotIndex: 2, position: "CB", line: "DEF", x: 65, y: 32 },
      { slotIndex: 3, position: "CM", line: "MID", x: 50, y: 58 },
      { slotIndex: 4, position: "ST", line: "ATT", x: 50, y: 85 },
    ],
    edges: [
      [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4],
    ],
  },
  "1-1-2": {
    name: "1-1-2",
    matchSize: 5,
    nodes: [
      { slotIndex: 0, position: "GK", line: "GK", x: 50, y: 12 },
      { slotIndex: 1, position: "CB", line: "DEF", x: 50, y: 35 },
      { slotIndex: 2, position: "CM", line: "MID", x: 50, y: 60 },
      { slotIndex: 3, position: "ST", line: "ATT", x: 32, y: 85 },
      { slotIndex: 4, position: "CF", line: "ATT", x: 68, y: 85 },
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [2, 4], [3, 4],
    ],
  },
};

/** Valid formation codes across both match sizes. */
export const FORMATION_CODES = Object.keys(FORMATIONS);

/** Retrieves a formation graph by code. */
export function getFormationGraph(name: string): FormationGraph | undefined {
  return FORMATIONS[name];
}

/** Retrieves a formation node by its slot index. */
export function getFormationNode(graph: FormationGraph, slotIndex: number): FormationNode | undefined {
  return graph.nodes.find((n) => n.slotIndex === slotIndex);
}

/** Tactical line for a formation node (GK/DEF/MID/ATT). */
export function getTacticalLine(graph: FormationGraph, slotIndex: number): "GK" | "DEF" | "MID" | "ATT" {
  return getFormationNode(graph, slotIndex)?.line ?? "DEF";
}

/** Neighbor slot indexes for a given slot (adjacency list). */
export function getAdjacentSlots(graph: FormationGraph, slotIndex: number): number[] {
  return graph.edges
    .filter(([a, b]) => a === slotIndex || b === slotIndex)
    .map(([a, b]) => (a === slotIndex ? b : a));
}

export function isValidFormation(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(FORMATIONS, name);
}

// ── Formation round plumbing (client-safe: also used by UI for pitch targets) ──

const LINE_ORDER: Record<string, number> = { GK: 0, DEF: 1, MID: 2, ATT: 3 };

/** Formation draft order: GK → DEF → MID → ATT, node order within each line. */
export function getRoundOrder(formationName: string): Array<{ round: number; position: string; slotIndex: number }> {
  const graph = getFormationGraph(formationName);
  if (!graph) throw new Error(`Unknown formation: ${formationName}`);
  const ordered = [...graph.nodes].sort(
    (a, b) => (LINE_ORDER[a.line] ?? 9) - (LINE_ORDER[b.line] ?? 9) || a.slotIndex - b.slotIndex
  );
  return ordered.map((n, i) => ({ round: i + 1, position: n.position, slotIndex: n.slotIndex }));
}

export function roundCountFor(formationName: string, isDuo: boolean = false): number {
  const graph = getFormationGraph(formationName);
  if (!graph) throw new Error(`Unknown formation: ${formationName}`);
  return graph.nodes.length * (isDuo ? 2 : 1);
}

export function getNodeForRound(
  formationName: string,
  round: number,
  isDuo: boolean = false
): { position: string; slotIndex: number } {
  const pickIndex = isDuo ? Math.ceil(round / 2) : round;
  const entry = getRoundOrder(formationName).find((r) => r.round === pickIndex);
  if (!entry) throw new Error(`Round ${round} (pick ${pickIndex}) out of range for ${formationName}`);
  return { position: entry.position, slotIndex: entry.slotIndex };
}

export function validateFormation(name: string): void {
  if (!getFormationGraph(name)) throw new Error(`Unknown formation: ${name}`);
}