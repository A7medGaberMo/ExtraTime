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
  const statFiles = readJsonFilesRecursively(statsDir);

  console.log(`Found ${statFiles.length} per-player FBref stat JSON files in data/stats/`);

  if (statFiles.length === 0) {
    console.log("No per-player stat JSON files found to seed.");
    return;
  }

  // Load all players from Convex Cloud DB
  console.log("Fetching players list from Convex for strict ID linking...");
  const players = await callQuery("players/queries:getAll", {});
  console.log(`✓ Retried ${players.length} players from Convex DB.`);

  const playerMap = new Map();
  for (const p of players) {
    playerMap.set(p.name.toLowerCase(), p._id);
    if (p.apiId) {
      playerMap.set(String(p.apiId).toLowerCase(), p._id);
    }
  }

  let allStatsToSeed = [];

  for (const file of statFiles) {
    const fileRecords = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const r of fileRecords) {
      const key = (r.apiId || r.playerName).toLowerCase();
      const playerId = playerMap.get(key) || playerMap.get(r.playerName.toLowerCase());
      if (playerId) {
        allStatsToSeed.push({ ...r, playerId });
      }
    }
  }

  console.log(`✓ Mapped ${allStatsToSeed.length} FBref stat records to Convex Player IDs.`);

  // Batch insert into Convex
  const batches = [];
  for (let i = 0; i < allStatsToSeed.length; i += BATCH_SIZE) {
    batches.push(allStatsToSeed.slice(i, i + BATCH_SIZE));
  }

  console.log(`Seeding ${allStatsToSeed.length} stats across ${batches.length} batch(es)...`);
  for (let i = 0; i < batches.length; i++) {
    const res = await callMutation("careerStats/mutations:insertBatch", {
      stats: batches[i],
    });
    console.log(`  ✓ Stats Batch ${i + 1}/${batches.length}: Inserted ${res.count}`);
  }

  console.log("\n✓ All per-player FBref stats successfully linked and seeded into Convex!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
