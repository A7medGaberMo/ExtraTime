import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const client = new ConvexHttpClient(CONVEX_URL);

console.log(`Connecting to Convex at: ${CONVEX_URL}`);

function getAllJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const activeDir = path.join(__dirname, '..', 'data', 'players', 'active');
const activeFiles = getAllJsonFiles(activeDir);

const legendsPath = path.join(__dirname, '..', 'data', 'players', 'legends', 'legends.json');
let legendsData = [];
if (fs.existsSync(legendsPath)) {
  legendsData = JSON.parse(fs.readFileSync(legendsPath, 'utf8'));
}

const allPlayers = [];
const seenKeys = new Set();
const tierCounts = {};

// 1. Process active players
activeFiles.forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clubObj = data.club;
  if (!clubObj || !data.players) return;

  data.players.forEach(p => {
    const key = p.apiId ? `apiId:${p.apiId}` : `name:${p.name.toLowerCase().trim()}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    const tier = p.tier || "GOLD";
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;

    allPlayers.push({
      apiId: String(p.apiId || Math.floor(Math.random() * 1000000)),
      name: p.name,
      position: p.position || "CM",
      club: clubObj.name,
      league: clubObj.league || undefined,
      nation: p.nation || "England",
      tier,
      isLegend: false,
      imageUrl: p.imageUrl || "https://media.api-sports.io/football/players/1.png",
      kitNumber: p.kitNumber || 10
    });
  });
});

// 2. Process legends
legendsData.forEach(p => {
  const key = `legend:${p.name.toLowerCase().trim()}`;
  if (seenKeys.has(key)) return;
  seenKeys.add(key);

  const tier = "ICON";
  tierCounts[tier] = (tierCounts[tier] || 0) + 1;

  allPlayers.push({
    apiId: String(p.apiId || Math.floor(Math.random() * 1000000)),
    name: p.name,
    position: p.position || "ST",
    club: "Icon",
    league: "Global Legends",
    nation: p.nation || "Unknown",
    tier: "ICON",
    isLegend: true,
    imageUrl: p.imageUrl || "https://media.api-sports.io/football/players/1.png",
    kitNumber: p.kitNumber || 10
  });
});

console.log(`Collected ${allPlayers.length} total players across active & legends.`);
console.log('Tier distribution:', tierCounts);

// Convex mutations have a size limit. Batch into chunks of 500 players.
const BATCH_SIZE = 500;
const batches = [];
for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
  batches.push(allPlayers.slice(i, i + BATCH_SIZE));
}

console.log(`Sending ${batches.length} batch(es) to Convex...`);

try {
  // First batch uses seedAllData (which clears DB first)
  const result = await client.mutation(api.seed.seedData.seedAllData, { players: batches[0] });
  console.log(`Batch 1/${batches.length} seeded:`, JSON.stringify(result, null, 2));

  // Subsequent batches use appendData (no clear)
  for (let i = 1; i < batches.length; i++) {
    const appendResult = await client.mutation(api.seed.seedData.appendData, { players: batches[i] });
    console.log(`Batch ${i + 1}/${batches.length} seeded:`, JSON.stringify(appendResult, null, 2));
  }

  console.log(`\n✅ Seeding complete! ${allPlayers.length} players across ${batches.length} batch(es).`);
} catch (err) {
  console.error('Seeding failed:', err);
  process.exit(1);
}
