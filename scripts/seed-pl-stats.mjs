import fs from 'fs/promises';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
const STATS_DIR = path.join(process.cwd(), 'data', 'stats', 'active', 'premier-league');

async function main() {
  console.log("Loading stats from filesystem...");
  const clubs = await fs.readdir(STATS_DIR);
  
  const allStats = [];

  for (const club of clubs) {
    const clubDir = path.join(STATS_DIR, club);
    const statFiles = await fs.readdir(clubDir).catch(() => []);
    
    for (const file of statFiles) {
      if (!file.endsWith('.json')) continue;
      
      const content = await fs.readFile(path.join(clubDir, file), 'utf8');
      try {
        const playerStat = JSON.parse(content);
        if (playerStat.apiId) {
          allStats.push(playerStat);
        }
      } catch (e) {
        console.error(`Error parsing ${file}: ${e}`);
      }
    }
  }

  console.log(`Found ${allStats.length} player stats to seed.`);
  
  // Seed in batches of 50 to avoid hitting limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < allStats.length; i += BATCH_SIZE) {
    const batch = allStats.slice(i, i + BATCH_SIZE);
    console.log(`Pushing batch ${i / BATCH_SIZE + 1} (${batch.length} players)...`);
    
    try {
      await client.mutation(api.seed.seedCareerStats.seedCompactStatsBatch, {
        stats: batch
      });
    } catch (e) {
      console.error(`Error seeding batch:`, e);
    }
  }

  console.log("Seeding complete! Everything is synced to Convex.");
}

main().catch(console.error);
