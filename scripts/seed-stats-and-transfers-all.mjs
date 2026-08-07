import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = "https://shocking-woodpecker-506.convex.cloud";
const BATCH_SIZE = 100;

function readJsonFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(readJsonFilesRecursively(fullPath));
    } else if (item.endsWith(".json")) {
      results.push(fullPath);
    }
  }
  return results;
}

function parsePlayerProfile(content) {
  const stats = [];
  if (!content.player) return stats;

  const playerName = content.player.name;
  const apiId = content.player.apiId;

  // 1. Seasonal
  if (Array.isArray(content.seasonal)) {
    for (const s of content.seasonal) {
      stats.push({
        playerName,
        apiId,
        season: s.season,
        squad: s.squad,
        competition: s.competition,
        matchesPlayed: Number(s.mp ?? s.matchesPlayed ?? 0),
        starts: Number(s.starts ?? 0),
        minutesPlayed: Number(s.min ?? s.minutesPlayed ?? 0),
        goals: Number(s.goals ?? 0),
        assists: Number(s.assists ?? 0),
        yellowCards: Number(s.yellowCards ?? 0),
        redCards: Number(s.redCards ?? 0),
        goalsPer90: s.goalsPer90 != null ? Number(s.goalsPer90) : undefined,
        assistsPer90: s.assistsPer90 != null ? Number(s.assistsPer90) : undefined,
        gPlusAPer90: s.gPlusAPer90 != null ? Number(s.gPlusAPer90) : undefined,
        cleanSheets: s.cleanSheets != null ? Number(s.cleanSheets) : undefined,
        goalsConceded: s.goalsConceded != null ? Number(s.goalsConceded) : undefined,
        saves: s.saves != null ? Number(s.saves) : undefined,
        recordType: "SEASONAL",
      });
    }
  }

  // 2. Per Club
  if (Array.isArray(content.perClub)) {
    for (const c of content.perClub) {
      stats.push({
        playerName,
        apiId,
        squad: c.squad,
        competition: "All Competitions",
        matchesPlayed: Number(c.mp ?? c.matchesPlayed ?? 0),
        starts: Number(c.starts ?? 0),
        minutesPlayed: Number(c.min ?? c.minutesPlayed ?? 0),
        goals: Number(c.goals ?? 0),
        assists: Number(c.assists ?? 0),
        yellowCards: Number(c.yellowCards ?? 0),
        redCards: Number(c.redCards ?? 0),
        goalsPer90: c.goalsPer90 != null ? Number(c.goalsPer90) : undefined,
        assistsPer90: c.assistsPer90 != null ? Number(c.assistsPer90) : undefined,
        gPlusAPer90: c.gPlusAPer90 != null ? Number(c.gPlusAPer90) : undefined,
        cleanSheets: c.cleanSheets != null ? Number(c.cleanSheets) : undefined,
        goalsConceded: c.goalsConceded != null ? Number(c.goalsConceded) : undefined,
        saves: c.saves != null ? Number(c.saves) : undefined,
        recordType: "PER_CLUB",
      });
    }
  }

  // 3. Per Competition
  if (Array.isArray(content.perCompetition)) {
    for (const comp of content.perCompetition) {
      stats.push({
        playerName,
        apiId,
        squad: "All Clubs",
        competition: comp.competition,
        matchesPlayed: Number(comp.mp ?? comp.matchesPlayed ?? 0),
        starts: Number(comp.starts ?? 0),
        minutesPlayed: Number(comp.min ?? comp.minutesPlayed ?? 0),
        goals: Number(comp.goals ?? 0),
        assists: Number(comp.assists ?? 0),
        yellowCards: Number(comp.yellowCards ?? 0),
        redCards: Number(comp.redCards ?? 0),
        goalsPer90: comp.goalsPer90 != null ? Number(comp.goalsPer90) : undefined,
        assistsPer90: comp.assistsPer90 != null ? Number(comp.assistsPer90) : undefined,
        gPlusAPer90: comp.gPlusAPer90 != null ? Number(comp.gPlusAPer90) : undefined,
        cleanSheets: comp.cleanSheets != null ? Number(comp.cleanSheets) : undefined,
        goalsConceded: comp.goalsConceded != null ? Number(comp.goalsConceded) : undefined,
        saves: comp.saves != null ? Number(comp.saves) : undefined,
        recordType: "PER_COMPETITION",
      });
    }
  }

  // 4. Career Total
  if (content.careerTotal && typeof content.careerTotal === "object") {
    const ct = content.careerTotal;
    stats.push({
      playerName,
      apiId,
      squad: ct.squad || "All Clubs",
      competition: ct.competition || "All Competitions",
      matchesPlayed: Number(ct.mp ?? ct.matchesPlayed ?? 0),
      starts: Number(ct.starts ?? 0),
      minutesPlayed: Number(ct.min ?? ct.minutesPlayed ?? 0),
      goals: Number(ct.goals ?? 0),
      assists: Number(ct.assists ?? 0),
      yellowCards: Number(ct.yellowCards ?? 0),
      redCards: Number(ct.redCards ?? 0),
      goalsPer90: ct.goalsPer90 != null ? Number(ct.goalsPer90) : undefined,
      assistsPer90: ct.assistsPer90 != null ? Number(ct.assistsPer90) : undefined,
      gPlusAPer90: ct.gPlusAPer90 != null ? Number(ct.gPlusAPer90) : undefined,
      cleanSheets: ct.cleanSheets != null ? Number(ct.cleanSheets) : undefined,
      goalsConceded: ct.goalsConceded != null ? Number(ct.goalsConceded) : undefined,
      saves: ct.saves != null ? Number(ct.saves) : undefined,
      recordType: "CAREER_TOTAL",
    });
  }

  return stats;
}

function collectAllStats() {
  const statsDir = path.join(__dirname, "..", "data", "stats");
  const statFiles = readJsonFilesRecursively(statsDir);

  let allStats = [];

  for (const file of statFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(content)) {
        allStats.push(...content);
      } else if (content.stats && Array.isArray(content.stats)) {
        allStats.push(...content.stats);
      } else if (content.player) {
        allStats.push(...parsePlayerProfile(content));
      }
    } catch (e) {
      console.error(`Error reading stat file ${file}:`, e.message);
    }
  }

  return allStats;
}

async function callMutation(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${fnPath} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.status === "error") {
    throw new Error(`Convex ${fnPath} error: ${json.errorMessage}`);
  }
  return json.value;
}

async function callQuery(fnPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: fnPath, args }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Convex ${fnPath} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.status === "error") {
    throw new Error(`Convex ${fnPath} error: ${json.errorMessage}`);
  }
  return json.value;
}

async function main() {
  const allStats = collectAllStats();
  console.log(`Collected ${allStats.length} career stats entries across all per-player JSON files.`);

  // Load all players from Convex to map names & apiIds to _id
  console.log("\nFetching players list from Convex for fast zero-read mapping...");
  const players = await callQuery("players/queries:getAll", {});
  console.log(`✓ Retrieved ${players.length} players from Convex DB.`);

  const playerMap = new Map();
  for (const p of players) {
    playerMap.set(p.name.toLowerCase(), p._id);
    if (p.apiId) {
      playerMap.set(String(p.apiId).toLowerCase(), p._id);
    }
  }

  // Map stats to playerId
  const mappedStats = [];
  for (const s of allStats) {
    const key = (s.apiId || s.playerName).toLowerCase();
    const playerId = playerMap.get(key) || playerMap.get(s.playerName.toLowerCase());
    if (playerId) {
      mappedStats.push({ ...s, playerId });
    }
  }

  console.log(`✓ Mapped ${mappedStats.length}/${allStats.length} stats to Convex Player IDs.`);

  // Clear existing careerStats in chunks
  console.log("\nClearing existing careerStats table in Convex...");
  let clearedStats = 0;
  while (true) {
    const res = await callMutation("careerStats/mutations:clearAll", {});
    clearedStats += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedStats} careerStats items.`);

  // Batch seed stats
  const statBatches = [];
  for (let i = 0; i < mappedStats.length; i += BATCH_SIZE) {
    statBatches.push(mappedStats.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nSeeding ${mappedStats.length} stats across ${statBatches.length} batch(es)...`);
  for (let i = 0; i < statBatches.length; i++) {
    const result = await callMutation("careerStats/mutations:insertBatch", {
      stats: statBatches[i],
    });
    console.log(`  ✓ Stats Batch ${i + 1}/${statBatches.length}: Inserted ${result.count}`);
  }

  console.log(`\n✓ SUCCESS! All ${mappedStats.length} Career Stats entries are fully seeded into Convex DB!`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
