import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = "https://shocking-woodpecker-506.convex.cloud";
const BATCH_SIZE = 200;

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

function collectAllStatsAndTransfers() {
  const statsDir = path.join(__dirname, "..", "data", "stats");
  const transfersDir = path.join(__dirname, "..", "data", "transfers");

  const statFiles = readJsonFilesRecursively(statsDir);
  const transferFiles = readJsonFilesRecursively(transfersDir);

  let allStats = [];
  let allTransfers = [];

  for (const file of statFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(content)) {
        allStats.push(...content);
      } else if (content.stats && Array.isArray(content.stats)) {
        allStats.push(...content.stats);
      }
    } catch (e) {
      console.error(`Error reading stat file ${file}:`, e.message);
    }
  }

  for (const file of transferFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(content)) {
        allTransfers.push(...content);
      } else if (content.transfers && Array.isArray(content.transfers)) {
        allTransfers.push(...content.transfers);
      }
    } catch (e) {
      console.error(`Error reading transfer file ${file}:`, e.message);
    }
  }

  return { allStats, allTransfers };
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
  const { allStats, allTransfers } = collectAllStatsAndTransfers();
  console.log(`Collected ${allStats.length} career stats entries and ${allTransfers.length} transfer entries.`);

  // Load all players from Convex to map names & apiIds to _id
  console.log("\nFetching players list from Convex for fast zero-read mapping...");
  const players = await callQuery("players/queries:getAll", {});
  console.log(`✓ Retried ${players.length} players from Convex DB.`);

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

  // Map transfers to playerId
  const mappedTransfers = [];
  for (const t of allTransfers) {
    const key = (t.apiId || t.playerName).toLowerCase();
    const playerId = playerMap.get(key) || playerMap.get(t.playerName.toLowerCase());
    if (playerId) {
      mappedTransfers.push({ ...t, playerId });
    }
  }

  console.log(`✓ Mapped ${mappedStats.length}/${allStats.length} stats and ${mappedTransfers.length}/${allTransfers.length} transfers to Convex Player IDs.`);

  // Clear existing careerStats in chunks
  console.log("\nClearing existing careerStats table in Convex...");
  let clearedStats = 0;
  while (true) {
    const res = await callMutation("careerStats/mutations:clearAll", {});
    clearedStats += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedStats} careerStats items.`);

  // Clear existing playerTransfers in chunks
  console.log("Clearing existing playerTransfers table in Convex...");
  let clearedTransfers = 0;
  while (true) {
    const res = await callMutation("transfers/mutations:clearAll", {});
    clearedTransfers += res.deleted;
    if (!res.remaining || res.deleted === 0) break;
  }
  console.log(`  ✓ Cleared ${clearedTransfers} playerTransfers items.`);

  // Batch seed stats
  const statBatches = [];
  for (let i = 0; i < mappedStats.length; i += BATCH_SIZE) {
    statBatches.push(mappedStats.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nSeeding ${mappedStats.length} stats across ${statBatches.length} batch(es)...`);
  for (let i = 0; i < statBatches.length; i++) {
    const result = await callMutation("seed/seedStatsAndTransfers:seedStatsAndTransfersBatch", {
      stats: statBatches[i],
      transfers: [],
    });
    console.log(`  ✓ Stats Batch ${i + 1}/${statBatches.length}: Inserted ${result.statsInserted}`);
  }

  // Batch seed transfers
  const transferBatches = [];
  for (let i = 0; i < mappedTransfers.length; i += BATCH_SIZE) {
    transferBatches.push(mappedTransfers.slice(i, i + BATCH_SIZE));
  }

  console.log(`\nSeeding ${mappedTransfers.length} transfers across ${transferBatches.length} batch(es)...`);
  for (let i = 0; i < transferBatches.length; i++) {
    const result = await callMutation("seed/seedStatsAndTransfers:seedStatsAndTransfersBatch", {
      stats: [],
      transfers: transferBatches[i],
    });
    console.log(`  ✓ Transfers Batch ${i + 1}/${transferBatches.length}: Inserted ${result.transfersInserted}`);
  }

  console.log(`\n✓ SUCCESS! All ${players.length} players' Career Stats & Transfer Histories are fully seeded into Convex!`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
