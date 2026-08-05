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
 * Parses raw copy-pasted FBref table text into structured JSON records.
 * Supports both Outfield Player tables and Goalkeeper tables.
 */
export function parseFBrefTableText(rawText, playerMeta) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const records = [];

  for (const line of lines) {
    // Ignore header lines or navigational UI strings
    if (
      line.startsWith("Standard Stats") ||
      line.startsWith("Goal Logs") ||
      line.startsWith("Modify") ||
      line.startsWith("Get as") ||
      line.startsWith("Get Link") ||
      line.startsWith("About") ||
      line.startsWith("Video") ||
      line.startsWith("Data Usage") ||
      line.startsWith("Glossary") ||
      line.startsWith("Playing Time") ||
      line.startsWith("Performance") ||
      line.startsWith("Penalty Kicks") ||
      line.startsWith("Season\tAge") ||
      line.startsWith("Country\tComp")
    ) {
      continue;
    }

    const parts = line.split("\t").map((p) => p.trim());
    if (parts.length < 5) continue;

    const firstToken = parts[0];

    // Case 1: Seasonal Line (e.g., "1997-1998" or "2006-2007")
    if (/^\d{4}(-\d{4})?$/.test(firstToken) || /^\d{4}$/.test(firstToken)) {
      const season = firstToken;
      const age = parseInt(parts[1], 10) || undefined;
      const squad = parts[2] || playerMeta.club || "Unknown Club";

      if (playerMeta.isGoalkeeper) {
        // Goalkeeper Seasonal Row:
        // Season Age Squad Country Comp LgRank MP Starts Min 90s GA GA90 SoTA Saves Save% W D L CS CS% PKatt PKA PKsv PKm Save% Matches
        const country = parts[3];
        const competition = parts[4];
        const lgRank = parts[5];
        const mp = parseInt(parts[6], 10) || 0;
        const starts = parseInt(parts[7], 10) || 0;
        const minStr = parts[8] ? parts[8].replace(/,/g, "") : "0";
        const min = parseInt(minStr, 10) || 0;
        const ninetys = parseFloat(parts[9]) || 0;

        const ga = parseInt(parts[10], 10) || 0;
        const gaPer90 = parseFloat(parts[11]) || 0;
        const sota = parseInt(parts[12], 10) || 0;
        const saves = parseInt(parts[13], 10) || 0;
        const savePct = parseFloat(parts[14]) || 0;

        const w = parseInt(parts[15], 10) || 0;
        const d = parseInt(parts[16], 10) || 0;
        const l = parseInt(parts[17], 10) || 0;
        const cs = parseInt(parts[18], 10) || 0;
        const csPct = parseFloat(parts[19]) || 0;

        records.push({
          playerId: playerMeta.playerId || "",
          playerName: playerMeta.name,
          apiId: playerMeta.apiId || "",
          season,
          age,
          squad,
          country,
          competition,
          lgRank,
          matchesPlayed: mp,
          starts,
          minutesPlayed: min,
          ninetys,
          goals: 0,
          assists: 0,
          goalsAgainst: ga,
          gaPer90,
          shotsOnTargetAgainst: sota,
          saves,
          savePercentage: savePct,
          wins: w,
          draws: d,
          losses: l,
          cleanSheets: cs,
          csPercentage: csPct,
          recordType: "SEASONAL",
        });
      } else {
        // Outfield Seasonal Row:
        // Season Age Squad Country Comp LgRank MP Starts Min 90s Gls Ast G+A G-PK PK PKatt CrdY CrdR Gls Ast G+A G-PK G+A-PK Matches
        const country = parts[3];
        const competition = parts[4];
        const lgRank = parts[5];
        const mp = parseInt(parts[6], 10) || 0;
        const starts = parseInt(parts[7], 10) || 0;
        const minStr = parts[8] ? parts[8].replace(/,/g, "") : "0";
        const min = parseInt(minStr, 10) || 0;
        const ninetys = parseFloat(parts[9]) || 0;

        const gls = parseInt(parts[10], 10) || 0;
        const ast = parseInt(parts[11], 10) || 0;
        const ga = parseInt(parts[12], 10) || (gls + ast);
        const gMinusPk = parseInt(parts[13], 10) || gls;
        const pk = parseInt(parts[14], 10) || 0;
        const pkAtt = parseInt(parts[15], 10) || 0;
        const crdY = parseInt(parts[16], 10) || 0;
        const crdR = parseInt(parts[17], 10) || 0;

        const glsPer90 = parseFloat(parts[18]) || (ninetys > 0 ? Number((gls / ninetys).toFixed(2)) : 0);
        const astPer90 = parseFloat(parts[19]) || (ninetys > 0 ? Number((ast / ninetys).toFixed(2)) : 0);
        const gPlusAPer90 = parseFloat(parts[20]) || (ninetys > 0 ? Number((ga / ninetys).toFixed(2)) : 0);
        const nonPenaltyGlsPer90 = parseFloat(parts[21]) || (ninetys > 0 ? Number((gMinusPk / ninetys).toFixed(2)) : 0);

        records.push({
          playerId: playerMeta.playerId || "",
          playerName: playerMeta.name,
          apiId: playerMeta.apiId || "",
          season,
          age,
          squad,
          country,
          competition,
          lgRank,
          matchesPlayed: mp,
          starts,
          minutesPlayed: min,
          ninetys,
          goals: gls,
          assists: ast,
          goalsAndAssists: ga,
          nonPenaltyGoals: gMinusPk,
          penaltiesScored: pk,
          penaltiesAttempted: pkAtt,
          yellowCards: crdY,
          redCards: crdR,
          goalsPer90: glsPer90,
          assistsPer90: astPer90,
          gPlusAPer90,
          nonPenaltyGlsPer90,
          recordType: "SEASONAL",
        });
      }
    }
    // Case 2: Squad / League / Career Totals Summary Row (e.g. "Barcelona (6 Seasons)" or "11 Seasons")
    else if (firstToken.includes("Seasons") || firstToken.includes("Leagues") || firstToken.includes("League")) {
      const isSquadSummary = firstToken.includes("(");
      const isCareerTotal = firstToken.includes("Seasons") && !firstToken.includes("(");

      records.push({
        playerId: playerMeta.playerId || "",
        playerName: playerMeta.name,
        apiId: playerMeta.apiId || "",
        season: isCareerTotal ? "CAREER_TOTAL" : firstToken,
        squad: isSquadSummary ? firstToken.split("(")[0].trim() : playerMeta.club || "All Clubs",
        competition: isCareerTotal ? "All Competitions" : firstToken,
        matchesPlayed: parseInt(parts[parts.length > 10 ? 6 : 3], 10) || 0,
        starts: parseInt(parts[parts.length > 10 ? 7 : 4], 10) || 0,
        minutesPlayed: parseInt((parts[parts.length > 10 ? 8 : 5] || "0").replace(/,/g, ""), 10) || 0,
        goals: parseInt(parts[10], 10) || 0,
        assists: parseInt(parts[11], 10) || 0,
        recordType: isCareerTotal ? "CAREER_TOTAL" : isSquadSummary ? "SQUAD_SUMMARY" : "LEAGUE_SUMMARY",
      });
    }
  }

  return records;
}

export function savePlayerFBrefStats(leagueSlug, clubSlug, playerSlug, statsRecords) {
  const targetDir = path.join(baseStatsDir, leagueSlug, clubSlug);
  ensureDir(targetDir);
  const filePath = path.join(targetDir, `${playerSlug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(statsRecords, null, 2));
  console.log(`  ✓ Saved FBref stats file: ${leagueSlug}/${clubSlug}/${playerSlug}.json (${statsRecords.length} records)`);
}
