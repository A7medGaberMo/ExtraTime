const fs = require('fs');
const path = require('path');

let keys = [];

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf-8');
  for (const line of env.split('\n')) {
    if (line.trim().startsWith('API_FOOTBALL_KEYS=')) {
      keys = line.split('=')[1].trim().split(',').map(k => k.trim()).filter(Boolean);
    }
  }
}

if (keys.length === 0) {
  console.log("⚠️ No API keys found! Please check API_FOOTBALL_KEYS in .env.local.");
  process.exit(1);
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
        console.log(`[Key ${keyIndex + 1}] Rate limit per minute (429). Waiting 10s...`);
        await new Promise(r => setTimeout(r, 10000));
        attempts++;
        continue;
      }

      if (res.status === 403) {
        console.log(`[Key ${keyIndex + 1}] Forbidden (403). Switching key...`);
        keyIndex = (keyIndex + 1) % keys.length;
        attempts++;
        continue;
      }

      const data = await res.json();
      
      if (data.errors && Object.keys(data.errors).length > 0) {
        const errStr = JSON.stringify(data.errors);
        if (errStr.includes("rate") || errStr.includes("per minute")) {
          console.log(`[Key ${keyIndex + 1}] Minute limit. Waiting 10s...`);
          await new Promise(r => setTimeout(r, 10000));
          attempts++;
          continue;
        }
        if (errStr.includes("requests") || errStr.includes("token") || errStr.includes("access")) {
          console.log(`[Key ${keyIndex + 1}] Access/quota error: ${errStr}. Switching key...`);
          keyIndex = (keyIndex + 1) % keys.length;
          attempts++;
          continue;
        }
      }

      return data;
    } catch (err) {
      console.error(`[Key ${keyIndex + 1}] Network error:`, err.message);
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
    }
  }

  throw new Error("❌ All API keys exhausted or failed!");
}

const LEAGUES = {
  39: 'premier-league',
  140: 'la-liga',
  135: 'serie-a',
  78: 'bundesliga',
  61: 'ligue-1'
};

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizePosition(rawPos) {
  if (!rawPos) return 'CM';
  const p = rawPos.trim().toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('defender')) return 'CB';
  if (p.includes('midfielder')) return 'CM';
  if (p.includes('attacker')) return 'ST';
  return 'CM';
}

async function fetchLeagueSquads(targetLeagueId = 39, season = 2024) {
  const leagueSlug = LEAGUES[targetLeagueId] || 'league-' + targetLeagueId;
  const baseDir = path.join(__dirname, 'data', 'players', 'active', leagueSlug);
  fs.mkdirSync(baseDir, { recursive: true });

  console.log(`\n🏆 Starting 1ST TEAM squad fetch for ${leagueSlug.toUpperCase()}...`);
  
  // 1. Fetch Teams
  const teamsData = await fetchWithKeyRotations(`teams?league=${targetLeagueId}&season=${season}`);
  const teams = teamsData?.response || [];
  
  if (teams.length === 0) {
    console.log(`❌ No teams found for league ${targetLeagueId} season ${season}.`);
    return;
  }
  
  console.log(`✅ Found ${teams.length} teams in ${leagueSlug}.\n`);

  for (let i = 0; i < teams.length; i++) {
    const t = teams[i];
    const teamId = t.team.id;
    const teamName = t.team.name;
    const clubSlug = slugify(teamName);
    const filePath = path.join(baseDir, `${clubSlug}.json`);

    console.log(`[${i + 1}/${teams.length}] ⚽ Fetching official 1st team squad for ${teamName} (ID: ${teamId})...`);

    // A. Fetch official 1st team squad roster (returns ~25-30 official 1st team players)
    const squadData = await fetchWithKeyRotations(`players/squads?team=${teamId}`);
    const officialSquad = squadData?.response?.[0]?.players || [];

    await new Promise(r => setTimeout(r, 6500)); // Rate limit pause

    // B. Fetch nationality mapping from /players endpoint (pages 1-2)
    const natMap = new Map();
    let page = 1;
    while (page <= 2) {
      const pData = await fetchWithKeyRotations(`players?team=${teamId}&season=${season}&page=${page}`);
      if (pData?.response) {
        for (const item of pData.response) {
          if (item.player && item.player.id) {
            natMap.set(item.player.id, item.player.nationality || 'Unknown');
          }
        }
      }
      page++;
      await new Promise(r => setTimeout(r, 6500));
    }

    // C. Clean & map ONLY official 1st team squad players
    const cleanedPlayers = officialSquad.map(p => {
      const nation = natMap.get(p.id) || 'Unknown';
      return {
        apiId: p.id,
        name: p.name ? p.name.trim() : 'Unknown',
        position: normalizePosition(p.position),
        club: teamName,
        nation: nation,
        tier: '',
        isLegend: false,
        imageUrl: p.photo || `https://media.api-sports.io/football/players/${p.id}.png`,
        kitNumber: p.number ? parseInt(p.number, 10) : null
      };
    });

    const teamFileContent = {
      club: {
        apiId: teamId,
        name: teamName,
        logo: t.team.logo,
        league: t.league?.name || 'Premier League',
        leagueId: targetLeagueId
      },
      players: cleanedPlayers
    };

    fs.writeFileSync(filePath, JSON.stringify(teamFileContent, null, 2));
    console.log(`   💾 Saved ${cleanedPlayers.length} official 1st team players to data/players/active/${leagueSlug}/${clubSlug}.json`);
    
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n🎉 Successfully fetched and cleaned all official 1st team squads for ${leagueSlug}!`);
}

const leagueArg = process.argv[2] ? parseInt(process.argv[2], 10) : 39;
const seasonArg = process.argv[3] ? parseInt(process.argv[3], 10) : 2024;

fetchLeagueSquads(leagueArg, seasonArg).catch(console.error);
