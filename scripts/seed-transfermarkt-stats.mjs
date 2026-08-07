import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = "https://shocking-woodpecker-506.convex.cloud";
const BATCH_SIZE = 150;

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
  const statsDir = path.join(__dirname, "..", "data", "stats");
  const files = readJsonFilesRecursively(statsDir);

  console.log(`Found ${files.length} per-player Transfermarkt files in data/stats/`);

  // Fetch players from Convex Cloud DB for strict ID linking
  console.log("Fetching players list from Convex for fast zero-read mapping...");
  const players = await callQuery("players/queries:getAll", {});
  console.log(`✓ Retried ${players.length} players from Convex DB.`);

  const playerMap = new Map();
  for (const p of players) {
    playerMap.set(p.name.toLowerCase(), p._id);
    if (p.apiId) {
      playerMap.set(String(p.apiId).toLowerCase(), p._id);
    }
  }

  // Clear existing careerStats table in chunks
  console.log("\nClearing existing careerStats table in Convex...");
  let clearedStats = 0;
  while (true) {
    const res = await callMutation("careerStats/mutations:clearAll", {});
    clearedStats += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedStats} careerStats items.`);

  const allStatsToSeed = [];

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      const p = data.player;
      if (!p) continue;

      const key = (p.apiId || p.name).toLowerCase();
      const playerId = playerMap.get(key) || playerMap.get(p.name.toLowerCase());
      if (!playerId) continue;

      // 1. Seasonal rows
      if (Array.isArray(data.seasonal)) {
        for (const s of data.seasonal) {
          allStatsToSeed.push({
            playerId,
            playerName: p.name,
            apiId: p.apiId,
            season: s.season,
            squad: s.squad,
            competition: s.competition,
            matchesPlayed: s.mp,
            starts: s.starts,
            minutesPlayed: s.min,
            goals: s.goals,
            assists: s.assists,
            yellowCards: s.yellowCards,
            redCards: s.redCards,
            goalsPer90: s.goalsPer90,
            assistsPer90: s.assistsPer90,
            gPlusAPer90: s.gPlusAPer90,
            cleanSheets: s.cleanSheets,
            goalsConceded: s.goalsConceded,
            saves: s.saves,
            recordType: "SEASONAL",
          });
        }
      }

      // 2. Per Club Summary rows
      if (Array.isArray(data.perClub)) {
        for (const c of data.perClub) {
          allStatsToSeed.push({
            playerId,
            playerName: p.name,
            apiId: p.apiId,
            squad: c.squad,
            competition: `${c.squad} Summary`,
            matchesPlayed: c.mp,
            starts: c.starts,
            minutesPlayed: c.min,
            goals: c.goals,
            assists: c.assists,
            yellowCards: c.yellowCards,
            redCards: c.redCards,
            goalsPer90: c.goalsPer90,
            assistsPer90: c.assistsPer90,
            gPlusAPer90: c.gPlusAPer90,
            cleanSheets: c.cleanSheets,
            goalsConceded: c.goalsConceded,
            saves: c.saves,
            recordType: "PER_CLUB",
          });
        }
      }

      // 3. Per Competition Summary rows
      if (Array.isArray(data.perCompetition)) {
        for (const comp of data.perCompetition) {
          allStatsToSeed.push({
            playerId,
            playerName: p.name,
            apiId: p.apiId,
            squad: p.club || "All Squads",
            competition: comp.competition,
            matchesPlayed: comp.mp,
            starts: comp.starts,
            minutesPlayed: comp.min,
            goals: comp.goals,
            assists: comp.assists,
            yellowCards: comp.yellowCards,
            redCards: comp.redCards,
            cleanSheets: comp.cleanSheets,
            goalsConceded: comp.goalsConceded,
            recordType: "PER_COMPETITION",
          });
        }
      }

      // 4. Career Total Summary row
      if (data.careerTotal) {
        const ct = data.careerTotal;
        allStatsToSeed.push({
          playerId,
          playerName: p.name,
          apiId: p.apiId,
          season: "CAREER_TOTAL",
          squad: ct.squad || "All Clubs",
          competition: ct.competition || "All Competitions",
          matchesPlayed: ct.mp,
          starts: ct.starts,
          minutesPlayed: ct.min,
          goals: ct.goals,
          assists: ct.assists,
          yellowCards: ct.yellowCards,
          redCards: ct.redCards,
          goalsPer90: ct.goalsPer90,
          assistsPer90: ct.assistsPer90,
          gPlusAPer90: ct.gPlusAPer90,
          cleanSheets: ct.cleanSheets,
          goalsConceded: ct.goalsConceded,
          saves: ct.saves,
          recordType: "CAREER_TOTAL",
        });
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e.message);
    }
  }

  console.log(`✓ Mapped ${allStatsToSeed.length} Transfermarkt stat records to Convex Player IDs.`);

  // Batch seed into Convex DB
  const batches = [];
  for (let i = 0; i < allStatsToSeed.length; i += BATCH_SIZE) {
    batches.push(allStatsToSeed.slice(i, i + BATCH_SIZE));
  }

  console.log(`Seeding ${allStatsToSeed.length} stats across ${batches.length} batch(es)...`);
  for (let i = 0; i < batches.length; i++) {
    const res = await callMutation("careerStats/mutations:insertBatch", {
      stats: batches[i],
    });
    console.log(`  ✓ Batch ${i + 1}/${batches.length}: Inserted ${res.count}`);
  }

  console.log("\n✓ All Transfermarkt per-player stats and pre-computed summaries successfully seeded into Convex!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
