import { ConvexHttpClient } from 'convex/browser';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const isProd = process.argv.includes('--prod');
const shouldClean = process.argv.includes('--clean') || process.argv.includes('--fresh') || true;
const prodUrl = 'https://wary-pig-127.convex.cloud';
const devUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://shocking-woodpecker-506.convex.cloud';
const url = isProd ? prodUrl : devUrl;

const client = new ConvexHttpClient(url);
console.log(`⚡ Convex Database Complete Sync [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
console.log('🔗 Connecting to Convex at:', url);

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.json')) {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

async function cleanTable(tableName) {
  process.stdout.write(`🧹 Cleaning table '${tableName}'... `);
  let totalDeleted = 0;
  while (true) {
    const res = await client.mutation('seed/seedData:clearTableBatch', {
      tableName,
      batchSize: 300,
    });
    totalDeleted += res.deleted;
    if (!res.hasMore || res.deleted === 0) break;
  }
  console.log(`deleted ${totalDeleted} records.`);
}

async function seedAllToConvex() {
  const startTime = Date.now();

  // 1. Truncate all tables to guarantee fresh 1:1 clean parity
  if (shouldClean) {
    console.log('\n🧹 Truncating players, clubs, and nations for fresh 1:1 parity...');
    await cleanTable('players');
    await cleanTable('clubs');
    await cleanTable('nations');
  }

  const activeFiles = getAllFiles('data/players/active');
  const legendFiles = getAllFiles('data/players/legends');

  console.log(
    `\n📂 Loading player files (${activeFiles.length} active squads, ${legendFiles.length} legend files)...`,
  );

  const allPlayers = [];
  const seenApiIds = new Set();

  // 2. Active Squads (140 files)
  for (const file of activeFiles) {
    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const club = content.club || {};
      const players = content.players || [];

      for (const p of players) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) continue;
        if (apiIdStr) seenApiIds.add(apiIdStr);

        allPlayers.push({
          name: p.name,
          position: p.position || 'CM',
          club: p.club || club.name || 'Unknown Club',
          nation: p.nation || 'Unknown',
          league: club.league || 'Global',
          tier: p.tier || 'GOLD',
          isLegend: Boolean(p.isLegend),
          seasonYear: typeof p.seasonYear === 'number' ? p.seasonYear : undefined,
          apiId: apiIdStr,
          imageUrl: p.imageUrl || undefined,
          kitNumber:
            typeof p.kitNumber === 'number' && Number.isInteger(p.kitNumber)
              ? p.kitNumber
              : undefined,
          rating: typeof p.rating === 'number' ? p.rating : undefined,
          clubLogo: club.logo || undefined,
          clubApiId: club.apiId ? String(club.apiId) : undefined,
        });
      }
    } catch (e) {
      console.error(`❌ Error reading ${file}:`, e.message);
    }
  }

  // 3. Legends (Icons & Heroes)
  for (const file of legendFiles) {
    if (path.basename(file) === 'legends.json') continue;

    try {
      const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const list = Array.isArray(content) ? content : content.players || [];

      for (const p of list) {
        const apiIdStr = p.apiId ? String(p.apiId) : undefined;
        if (apiIdStr && seenApiIds.has(apiIdStr)) continue;
        if (apiIdStr) seenApiIds.add(apiIdStr);

        allPlayers.push({
          name: p.name,
          position: p.position || 'ST',
          club: p.club || 'Legend Club',
          nation: p.nation || 'World',
          league: 'Legends',
          tier: p.tier === 'HERO' ? 'HERO' : 'ICON',
          isLegend: true,
          seasonYear: typeof p.seasonYear === 'number' ? p.seasonYear : undefined,
          apiId: apiIdStr,
          imageUrl: p.imageUrl || undefined,
          kitNumber:
            typeof p.kitNumber === 'number' && Number.isInteger(p.kitNumber)
              ? p.kitNumber
              : undefined,
          rating: typeof p.rating === 'number' ? p.rating : undefined,
          clubLogo: p.clubLogo || undefined,
          clubApiId: undefined,
        });
      }
    } catch (e) {
      console.error(`❌ Error reading legend file ${file}:`, e.message);
    }
  }

  console.log(`✅ Loaded ${allPlayers.length} total players with ratings & tiers.`);
  console.log('🚀 Pushing batches to Convex DB...');

  const BATCH_SIZE = 80;
  let successCount = 0;
  for (let i = 0; i < allPlayers.length; i += BATCH_SIZE) {
    const batch = allPlayers.slice(i, i + BATCH_SIZE);
    try {
      const res = await client.mutation('seed/seedData:upsertPlayersBatch', { players: batch });
      successCount += res?.count ?? batch.length;
      process.stdout.write(
        `\r[${Math.min(i + BATCH_SIZE, allPlayers.length)} / ${allPlayers.length}] players synced...`,
      );
    } catch (err) {
      console.error(`\n❌ Error at batch offset ${i}:`, err.message);
    }
  }

  console.log(
    `\n🎉 All players, tiers & calibrated ratings synced in ${((Date.now() - startTime) / 1000).toFixed(1)}s!`,
  );

  // 4. Seed verified Rank Question Bank
  console.log('\n🧩 Seeding Rank Question Bank...');
  try {
    const qRes = await client.mutation('rank/mutations:seedQuestionBank', {});
    console.log(`✅ Synced ${qRes.total} rank questions (Inserted: ${qRes.inserted}, Updated: ${qRes.updated}, Cleaned: ${qRes.deleted}).`);
  } catch (err) {
    console.error('❌ Error syncing rank questions:', err.message);
  }

  try {
    const stats = await client.query('players/queries:getStats', {});
    console.log('\n📊 Updated Convex DB Stats:', stats);
  } catch (e) {
    console.error('Failed to get stats:', e.message);
  }
}

seedAllToConvex().catch(console.error);
