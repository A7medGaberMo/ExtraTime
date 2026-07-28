export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST"
  | "CF";

export type MatchSize = 5 | 11;

const FORMATIONS_11: Record<string, Position[][]> = {
  "4-3-3": [
    ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"],
    ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
  ],
  "4-4-2": [["GK", "LB", "CB", "CB", "RB", "LW", "CM", "CM", "RW", "ST", "ST"]],
  "4-2-3-1": [["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "LW", "RW", "ST"]],
  "3-5-2": [["GK", "CB", "CB", "CB", "LW", "CM", "CDM", "CM", "RW", "ST", "CF"]],
};

const FORMATIONS_5: Record<string, Position[][]> = {
  "1-2-1": [["GK", "CB", "CM", "CAM", "ST"]],
  "2-1-1": [["GK", "CB", "CB", "CM", "ST"]],
  "1-1-2": [["GK", "CB", "CM", "ST", "CF"]],
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomFormation(matchSize: MatchSize) {
  return pick(Object.keys(matchSize === 5 ? FORMATIONS_5 : FORMATIONS_11));
}

export function getFormationPositions(formation: string, matchSize: MatchSize) {
  const registry = matchSize === 5 ? FORMATIONS_5 : FORMATIONS_11;
  const variants = registry[formation] || registry[matchSize === 5 ? "1-2-1" : "4-3-3"];
  return pick(variants);
}

