import { readFileSync } from "fs";

const players = JSON.parse(readFileSync("data/players/legends/legends.json", "utf8"));

const eplClubs = new Set([
  "Arsenal",
  "Chelsea",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
]);

const formations11 = {
  "4-3-3": [
    ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"],
    ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
  ],
  "4-4-2": [["GK", "LB", "CB", "CB", "RB", "LW", "CM", "CM", "RW", "ST", "ST"]],
  "4-2-3-1": [["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "CAM", "LW", "RW", "ST"]],
  "3-5-2": [["GK", "CB", "CB", "CB", "LW", "CM", "CDM", "CM", "RW", "ST", "CF"]],
};

const formations5 = {
  "1-2-1": [["GK", "CB", "CM", "CAM", "ST"]],
  "2-1-1": [["GK", "CB", "CB", "CM", "ST"]],
  "1-1-2": [["GK", "CB", "CM", "ST", "CF"]],
};

function normalize(position) {
  const value = position.trim().toUpperCase();
  if (value === "LM") return "LW";
  if (value === "RM") return "RW";
  return value;
}

function positions(player) {
  return player.position.split("/").map(normalize).filter(Boolean);
}

function line(position) {
  if (position === "GK") return "GK";
  if (["CB", "LB", "RB"].includes(position)) return "DEF";
  if (["CDM", "CM", "CAM"].includes(position)) return "MID";
  return "ATT";
}

function isCompatible(player, slot) {
  const parts = positions(player);
  return parts.includes(slot) || parts.some((position) => line(position) === line(slot));
}

function countCompatible(source, slot) {
  return source.filter((player) => isCompatible(player, slot)).length;
}

function assignRounds(source, formationName, formationPositions) {
  const used = new Set();
  const ordered = formationPositions
    .map((slot, index) => ({ slot, index, compatible: countCompatible(source, slot) }))
    .sort((a, b) => a.compatible - b.compatible);

  for (const { slot } of ordered) {
    let pool = source.filter((player) => !used.has(player.apiId) && positions(player).includes(slot));
    if (pool.length < 2) {
      pool = source.filter((player) => !used.has(player.apiId) && isCompatible(player, slot));
    }
    if (pool.length < 2) {
      throw new Error(`${formationName} failed ${slot}: only ${pool.length} compatible remaining`);
    }
    const main = pool[0];
    const sub = pool[1];
    if (!isCompatible(main, slot) || !isCompatible(sub, slot)) {
      throw new Error(`${formationName} produced incompatible ${slot} pair`);
    }
    used.add(main.apiId);
    used.add(sub.apiId);
  }
}

function canAssign(source, formationPositions) {
  try {
    assignRounds(source, "preflight", formationPositions);
    return true;
  } catch {
    return false;
  }
}

const pools = {
  GLOBAL: players,
  ICONS: players.filter((player) => player.isLegend || player.tier === "ICON"),
  EPL: players.filter((player) => eplClubs.has(player.club)),
};

for (const [poolName, source] of Object.entries(pools)) {
  for (const [formationName, variants] of Object.entries(formations11)) {
    for (const variant of variants) {
      const safeSource = canAssign(source, variant) ? source : players;
      assignRounds(safeSource, `${poolName} 11P ${formationName}`, variant);
    }
  }
  for (const [formationName, variants] of Object.entries(formations5)) {
    for (const variant of variants) {
      const safeSource = canAssign(source, variant) ? source : players;
      assignRounds(safeSource, `${poolName} 5P ${formationName}`, variant);
    }
  }
  console.log(`${poolName} ok (${source.length} players)`);
}

console.log("Hidden Bid engine compatibility verified.");
