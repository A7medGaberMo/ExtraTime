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
const STATS_BASE = path.join(process.cwd(), 'data', 'stats', 'active');

async function collectStats(dir) {
  const stats = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        stats.push(...await collectStats(fullPath));
      } else if (entry.name.endsWith('.json')) {
        const content = await fs.readFile(fullPath, 'utf8');
        try {
          const data = JSON.parse(content);
          if (data.apiId) stats.push(data);
        } catch (e) {
          console.error(`Bad JSON: ${fullPath}`);
        }
      }
    }
  } catch (e) {}
  return stats;
}

async function main() {
  console.log("Collecting all stats from all leagues...");
  const allStats = await collectStats(STATS_BASE);
  console.log(`Found ${allStats.length} player stats to seed.`);

  const BATCH_SIZE = 50;
  let success = 0;
  let errors = 0;

  for (let i = 0; i < allStats.length; i += BATCH_SIZE) {
    const batch = allStats.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allStats.length / BATCH_SIZE);
    
    try {
      await client.mutation(api.seed.seedCareerStats.seedCompactStatsBatch, {
        stats: batch
      });
      success += batch.length;
      console.log(`Batch ${batchNum}/${totalBatches} ✓ (${success} total)`);
    } catch (e) {
      errors += batch.length;
      console.error(`Batch ${batchNum} FAILED: ${e.message}`);
    }
  }

  console.log(`\nDone! ${success} seeded, ${errors} failed.`);
}

main().catch(console.error);
