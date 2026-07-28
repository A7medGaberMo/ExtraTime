const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
let keys = [];
for (const line of env.split('\n')) {
  if (line.trim().startsWith('API_FOOTBALL_KEYS=')) {
    keys = line.split('=')[1].trim().split(',').map(k => k.trim()).filter(Boolean);
  }
}

let keyIndex = 0;

async function fetchWithKeyRotations(endpoint) {
  let attempts = 0;
  while (attempts < keys.length * 3) {
    const key = keys[keyIndex];
    
    try {
      const res = await fetch(`https://v3.football.api-sports.io/${endpoint}`, {
        headers: { 'x-apisports-key': key }
      });

      if (res.status === 429) {
        console.log(`[Key ${keyIndex + 1}] Rate limit 429. Waiting 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        attempts++;
        continue;
      }

      if (res.status === 403) {
        keyIndex = (keyIndex + 1) % keys.length;
        attempts++;
        continue;
      }

      const data = await res.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errStr = JSON.stringify(data.errors);
        if (errStr.includes("rate") || errStr.includes("per minute")) {
          await new Promise(r => setTimeout(r, 10000));
          attempts++;
          continue;
        }
        if (errStr.includes("requests") || errStr.includes("token") || errStr.includes("access")) {
          keyIndex = (keyIndex + 1) % keys.length;
          attempts++;
          continue;
        }
      }

      return data;
    } catch (err) {
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
    }
  }

  throw new Error("❌ All API keys exhausted or failed!");
}

async function enrichNations() {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  console.log(`🔍 Enriching nationalities for ${files.length} club JSON files...`);

  // Build a lookup map of player id -> nationality by querying seasons 2024 and 2023 if needed
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(dir, files[i]);
    const squadObj = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const clubId = squadObj.club.apiId;
    const clubName = squadObj.club.name;

    const unknownPlayers = squadObj.players.filter(p => !p.nation || p.nation === 'Unknown');
    if (unknownPlayers.length === 0) {
      console.log(`[${i + 1}/${files.length}] ✅ ${clubName} has 100% known nationalities.`);
      continue;
    }

    console.log(`[${i + 1}/${files.length}] 🔄 ${clubName}: ${unknownPlayers.length} unknown nations remaining. Fetching...`);

    const natMap = new Map();

    // Fetch pages 1..3 for season 2024
    for (let page = 1; page <= 3; page++) {
      const pData = await fetchWithKeyRotations(`players?team=${clubId}&season=2024&page=${page}`);
      if (pData?.response) {
        for (const item of pData.response) {
          if (item.player?.id && item.player?.nationality) {
            natMap.set(item.player.id, item.player.nationality);
          }
        }
      }
      await new Promise(r => setTimeout(r, 6500));
    }

    // Update squad players
    let resolvedCount = 0;
    for (const p of squadObj.players) {
      if ((!p.nation || p.nation === 'Unknown') && natMap.has(p.apiId)) {
        p.nation = natMap.get(p.apiId);
        resolvedCount++;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(squadObj, null, 2));
    console.log(`   ✨ Resolved ${resolvedCount} nationalities for ${clubName}.`);
  }

  console.log("🎉 Completed nationality enrichment pass!");
}

enrichNations().catch(console.error);
