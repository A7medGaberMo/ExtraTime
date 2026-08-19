import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!url) {
  console.error("❌ Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(url);
console.log("⚡ Convex Database Sync — Players & Tiers Only");
console.log("🔗 Connecting to Convex at:", url);

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
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

async function seedPlayersAndTiers() {
  const startTime = Date.now();
  const activeFiles = getAllFiles("data/players/active");
  const legendFiles = getAllFiles("data/players/legends");
  
  console.log(`\n📂 Loading player files (${activeFiles.length} active squads, ${legendFiles.length} legend files)...`);

  const allPlayers = [];
  const seenApiIds = new Set();

  // 1. Active Squads
  for (const file of activeFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf-8"));
      const club = content.club || {};
      const players = content.players || [];

      for (const p of players) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) continue;
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
      console.error(`❌ Error reading ${file}:`, e.message);
    }
  }

  // 2. Legends (Icons & Heroes)
  for (const file of legendFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, "utf-8"));
      const list = Array.isArray(content) ? content : (content.players || []);

      for (const p of list) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) continue;
        if (apiIdStr) seenApiIds.add(apiIdStr);

        allPlayers.push({
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
      console.error(`❌ Error reading legend file ${file}:`, e.message);
    }
  }

  console.log(`✅ Loaded ${allPlayers.length} total players (tiers & metadata).`);
  console.log("🚀 Syncing batches to Convex Cloud...");

  const BATCH_SIZE = 100;
  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);
    try {
      await client.mutation("seed/seedData:upsertPlayersBatch", { players: batch });
      process.stdout.write(`\r[${Math.min(i + BATCH_SIZE, allPlayers.length)} / ${allPlayers.length}] players synced...`);
    } catch (err) {
      console.error(`\n❌ Error at batch offset ${i}:`, err.message);
    }
  }

  console.log(`\n🎉 Player tiers and squad edits synced in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`);

  try {
    const stats = await client.query("players/queries:getStats", {});
    console.log("📊 Updated DB Stats:", stats);
  } catch (e) {
    // ignore
  }
}

seedPlayersAndTiers().catch(console.error);
