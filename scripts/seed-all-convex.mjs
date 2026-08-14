import fs from 'fs/promises';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function getJsonFiles(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(await getJsonFiles(fullPath));
    } else if (file.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  console.log("🚀 Starting Full Convex Seeding (Active Players + Legends)...");

  const allPlayers = [];

  // 1. Load active players from all leagues
  const activeRoot = path.join(process.cwd(), 'data', 'players', 'active');
  const activeFiles = await getJsonFiles(activeRoot);

  for (const file of activeFiles) {
    const content = JSON.parse(await fs.readFile(file, 'utf8'));
    const league = content.club?.league || "Active League";
    const club = content.club?.name || "Unknown Club";
    for (const p of content.players || []) {
      allPlayers.push({
        ...p,
        club: p.club || club,
        league,
        apiId: String(p.apiId || '')
      });
    }
  }
  console.log(`Loaded ${allPlayers.length} Active Players across ${activeFiles.length} club files.`);

  // 2. Load Legends (Icons + Heroes)
  const legendsPath = path.join(process.cwd(), 'data', 'players', 'legends', 'legends.json');
  const legends = JSON.parse(await fs.readFile(legendsPath, 'utf8'));
  for (const leg of legends) {
    allPlayers.push({
      ...leg,
      league: "Global Legends",
      apiId: String(leg.apiId || '')
    });
  }
  console.log(`Loaded ${legends.length} Legends (Icons + Heroes).`);
  console.log(`Total Dataset: ${allPlayers.length} Players.`);

  // 3. Push to Convex in batches
  const BATCH_SIZE = 40;
  let success = 0;
  let errors = 0;
  const totalBatches = Math.ceil(allPlayers.length / BATCH_SIZE);

  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    try {
      const res = await client.mutation(api.seed.seedData.upsertPlayersBatch, {
        players: batch
      });
      success += res.count || batch.length;
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`Batch ${batchNum}/${totalBatches} ✓ (${success}/${allPlayers.length} players synced)`);
      }
    } catch (e) {
      errors += batch.length;
      console.error(`Batch ${batchNum}/${totalBatches} FAILED: ${e.message}`);
    }
  }

  console.log(`\n🎉 Full Seeding Complete! ${success} total players successfully synced to Convex.`);
}

main().catch(console.error);
