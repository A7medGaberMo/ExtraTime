import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(url);
console.log("Connecting to Convex at:", url);

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".json")) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

async function seedActivePlayers() {
  console.log("\n--- Seeding Active Players ---");
  const files = getAllFiles("data/players/active");
  console.log(`Found ${files.length} active squad files.`);

  let allPlayers = [];
  const seenApiIds = new Set();

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf-8"));
      const club = content.club || {};
      const players = content.players || [];

      for (const p of players) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) {
          continue; // skip duplicate
        }
        if (apiIdStr) seenApiIds.add(apiIdStr);

        allPlayers.push({
          name: p.name,
          position: p.position || "CM",
          club: p.club || club.name || "Unknown Club",
          nation: p.nation || "Unknown",
          league: club.league || "Global",
          tier: p.tier || "GOLD",
          isLegend: Boolean(p.isLegend),
          seasonYear: typeof p.seasonYear === "number" ? p.seasonYear : undefined,
          apiId: apiIdStr,
          imageUrl: p.imageUrl || undefined,
          kitNumber: typeof p.kitNumber === "number" && Number.isInteger(p.kitNumber) ? p.kitNumber : undefined,
          clubLogo: club.logo || undefined,
          clubApiId: club.apiId ? String(club.apiId) : undefined,
        });
      }
    } catch (e) {
      console.error(`Error reading ${file}:`, e);
    }
  }

  console.log(`Prepared ${allPlayers.length} unique active players.`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);
    try {
      const res = await client.mutation("seed/seedData:upsertPlayersBatch", { players: batch });
      process.stdout.write(`\rActive Players: [${Math.min(i + BATCH_SIZE, allPlayers.length)} / ${allPlayers.length}] (${res.count} processed)`);
    } catch (err) {
      console.error(`\nError in active batch at offset ${i}:`, err);
    }
  }
  console.log("\nActive players seed complete!");
}

async function seedLegends() {
  console.log("\n--- Seeding Legends ---");
  const files = getAllFiles("data/players/legends");
  let allLegends = [];
  const seenApiIds = new Set();

  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf-8"));
      const list = Array.isArray(content) ? content : (content.players || []);

      for (const p of list) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) continue;
        if (apiIdStr) seenApiIds.add(apiIdStr);

        allLegends.push({
          name: p.name,
          position: p.position || "ST",
          club: p.club || "Legend Club",
          nation: p.nation || "World",
          league: "Legends",
          tier: p.tier === "HERO" ? "HERO" : "ICON",
          isLegend: true,
          seasonYear: typeof p.seasonYear === "number" ? p.seasonYear : undefined,
          apiId: apiIdStr,
          imageUrl: p.imageUrl || undefined,
          kitNumber: typeof p.kitNumber === "number" && Number.isInteger(p.kitNumber) ? p.kitNumber : undefined,
          clubLogo: p.clubLogo || undefined,
          clubApiId: undefined,
        });
      }
    } catch (e) {
      console.error(`Error reading legend file ${file}:`, e);
    }
  }

  console.log(`Prepared ${allLegends.length} unique legends.`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < allLegends.length; i += BATCH_SIZE) {
    const batch = allLegends.slice(i, i + BATCH_SIZE);
    try {
      const res = await client.mutation("seed/seedData:upsertPlayersBatch", { players: batch });
      process.stdout.write(`\rLegends: [${Math.min(i + BATCH_SIZE, allLegends.length)} / ${allLegends.length}] (${res.count} processed)`);
    } catch (err) {
      console.error(`\nError in legend batch at offset ${i}:`, err);
    }
  }
  console.log("\nLegends seed complete!");
}

async function seedStats() {
  console.log("\n--- Seeding Career Stats ---");
  if (!fs.existsSync("data/stats")) {
    console.log("No data/stats directory found, skipping.");
    return;
  }

  const files = getAllFiles("data/stats");
  console.log(`Found ${files.length} stats files.`);

  let allStats = [];
  for (const file of files) {
    try {
      const stat = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (stat.apiId && stat.name && stat.careerTotal) {
        allStats.push({
          apiId: stat.apiId,
          name: stat.name,
          clubs: (stat.clubs || []).map(c => ({
            club: c.club || "Unknown",
            appearances: Number(c.appearances) || 0,
            goals: Number(c.goals) || 0,
          })),
          national: (stat.national || []).map(n => ({
            team: n.team || "Unknown",
            appearances: Number(n.appearances) || 0,
            goals: Number(n.goals) || 0,
          })),
          careerTotal: {
            appearances: Number(stat.careerTotal.appearances) || 0,
            goals: Number(stat.careerTotal.goals) || 0,
          },
        });
      }
    } catch (e) {
      // ignore malformed
    }
  }

  console.log(`Prepared ${allStats.length} career stat records.`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < allStats.length; i += BATCH_SIZE) {
    const batch = allStats.slice(i, i + BATCH_SIZE);
    try {
      await client.mutation("seed/seedCareerStats:seedCompactStatsBatch", { stats: batch });
      process.stdout.write(`\rStats: [${Math.min(i + BATCH_SIZE, allStats.length)} / ${allStats.length}]`);
    } catch (err) {
      console.error(`\nError in stats batch at offset ${i}:`, err);
    }
  }
  console.log("\nStats seed complete!");
}

async function main() {
  const start = Date.now();
  await seedActivePlayers();
  await seedLegends();
  await seedStats();

  console.log("\n--- Final DB Stats Verification ---");
  try {
    const stats = await client.query("players/queries:getStats", {});
    console.log("Database Stats:", stats);
  } catch (e) {
    console.error("Error fetching stats:", e);
  }
  console.log(`Total seeding time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch(console.error);
