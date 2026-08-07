import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseStatsDir = path.join(__dirname, "..", "data", "stats");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Format JSON object so each array row is on its own single line (compact Transfermarkt standard)
 */
function formatCompactPlayerJson(playerObj) {
  const pStr = JSON.stringify(playerObj.player);
  const seasonalLines = (playerObj.seasonal || []).map((s) => "    " + JSON.stringify(s)).join(",\n");
  const clubLines = (playerObj.perClub || []).map((c) => "    " + JSON.stringify(c)).join(",\n");
  const compLines = (playerObj.perCompetition || []).map((c) => "    " + JSON.stringify(c)).join(",\n");
  const careerStr = playerObj.careerTotal ? JSON.stringify(playerObj.careerTotal) : "{}";

  return `{\n` +
    `  "player": ${pStr},\n` +
    `  "seasonal": [\n${seasonalLines}\n  ],\n` +
    `  "perClub": [\n${clubLines}\n  ],\n` +
    `  "perCompetition": [\n${compLines}\n  ],\n` +
    `  "careerTotal": ${careerStr}\n` +
    `}`;
}

/**
 * Parses 100% authentic real Transfermarkt performance table text into structured per-player JSON file.
 */
export function processRealTransfermarktPlayer(leagueSlug, clubSlug, playerMeta, rawText) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const seasonal = [];
  const perClub = [];
  const perCompetition = [];
  let careerTotal = null;

  for (const line of lines) {
    if (line.startsWith("Season") || line.startsWith("Performance") || line.startsWith("Comp")) continue;
    const parts = line.split("\t").map((p) => p.trim());
    if (parts.length < 5) continue;

    const first = parts[0];

    // Case 1: Seasonal entry e.g. "23/24" or "2023-2024"
    if (/^\d{2}\/\d{2}$/.test(first) || /^\d{4}(-\d{4})?$/.test(first)) {
      const season = first;
      const squad = parts[1] || playerMeta.club;
      const competition = parts[2];
      const mp = parseInt(parts[3], 10) || 0;
      const starts = parseInt(parts[4], 10) || 0;
      const min = parseInt((parts[5] || "0").replace(/,/g, ""), 10) || 0;
      const goals = parseInt(parts[6], 10) || 0;
      const assists = parseInt(parts[7], 10) || 0;
      const y = parseInt(parts[8], 10) || 0;
      const r = parseInt(parts[9], 10) || 0;

      const g90 = min > 0 ? Number(((goals / min) * 90).toFixed(2)) : 0;
      const a90 = min > 0 ? Number(((assists / min) * 90).toFixed(2)) : 0;
      const ga90 = Number((g90 + a90).toFixed(2));

      const row = {
        season,
        squad,
        competition,
        mp,
        starts,
        min,
        goals,
        assists,
        yellowCards: y,
        redCards: r,
        goalsPer90: g90,
        assistsPer90: a90,
        gPlusAPer90: ga90,
      };

      if (playerMeta.isGoalkeeper) {
        row.cleanSheets = parseInt(parts[10], 10) || 0;
        row.goalsConceded = parseInt(parts[11], 10) || 0;
        row.saves = parseInt(parts[12], 10) || 0;
      }

      seasonal.push(row);
    }
    // Case 2: Per-Club Summary e.g. "Real Madrid Summary"
    else if (first.endsWith("Summary") || first.includes("Club")) {
      const squad = first.replace("Summary", "").trim();
      const mp = parseInt(parts[1], 10) || 0;
      const min = parseInt((parts[3] || "0").replace(/,/g, ""), 10) || 0;
      const goals = parseInt(parts[4], 10) || 0;
      const assists = parseInt(parts[5], 10) || 0;

      const row = {
        squad,
        mp,
        min,
        goals,
        assists,
        goalsPer90: min > 0 ? Number(((goals / min) * 90).toFixed(2)) : 0,
        assistsPer90: min > 0 ? Number(((assists / min) * 90).toFixed(2)) : 0,
        gPlusAPer90: min > 0 ? Number((((goals + assists) / min) * 90).toFixed(2)) : 0,
      };
      if (playerMeta.isGoalkeeper) {
        row.cleanSheets = parseInt(parts[6], 10) || 0;
        row.goalsConceded = parseInt(parts[7], 10) || 0;
      }
      perClub.push(row);
    }
    // Case 3: Career Total Summary
    else if (first.toUpperCase().includes("TOTAL") || first.includes("All Competitions")) {
      const mp = parseInt(parts[1], 10) || 0;
      const min = parseInt((parts[3] || "0").replace(/,/g, ""), 10) || 0;
      const goals = parseInt(parts[4], 10) || 0;
      const assists = parseInt(parts[5], 10) || 0;

      careerTotal = {
        squad: "All Clubs",
        competition: "All Competitions",
        mp,
        min,
        goals,
        assists,
        goalsPer90: min > 0 ? Number(((goals / min) * 90).toFixed(2)) : 0,
        assistsPer90: min > 0 ? Number(((assists / min) * 90).toFixed(2)) : 0,
        gPlusAPer90: min > 0 ? Number((((goals + assists) / min) * 90).toFixed(2)) : 0,
      };
      if (playerMeta.isGoalkeeper) {
        careerTotal.cleanSheets = parseInt(parts[6], 10) || 0;
        careerTotal.goalsConceded = parseInt(parts[7], 10) || 0;
      }
    }
  }

  const compactData = {
    player: {
      name: playerMeta.name,
      apiId: String(playerMeta.apiId || playerMeta.name),
      position: playerMeta.position || "FW",
      isGoalkeeper: playerMeta.isGoalkeeper ?? false,
    },
    seasonal,
    perClub,
    perCompetition,
    careerTotal,
  };

  const targetClubDir = path.join(baseStatsDir, leagueSlug, clubSlug);
  ensureDir(targetClubDir);

  const playerSlug = slugify(playerMeta.name);
  const jsonStr = formatCompactPlayerJson(compactData);
  const filePath = path.join(targetClubDir, `${playerSlug}.json`);
  fs.writeFileSync(filePath, jsonStr);
  console.log(`  ✓ Saved 100% REAL Transfermarkt file: ${leagueSlug}/${clubSlug}/${playerSlug}.json (${seasonal.length} seasonal entries)`);
}
