import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.FOOTBALL_API_KEY || '80b6323c921cda2a6fb58ec3aabf1f90';
const BASE_URL = 'https://v3.football.api-sports.io';
const DELAY_MS = 6500; // 6.5s spacing = ~9.2 req/min (safely under 10 req/min limit)

// ═══════════════════════════════════════════════════════════════
// The EXACT 42 Global Clubs based on their API Numbers (apiId)
// ═══════════════════════════════════════════════════════════════
export const GLOBAL_42_CLUBS = [
  { name: 'Ajax', slug: 'ajax', league: 'Eredivisie', leagueId: 88, apiId: 194, defaultNation: 'Netherlands' },
  { name: 'PSV Eindhoven', slug: 'psv', league: 'Eredivisie', leagueId: 88, apiId: 197, defaultNation: 'Netherlands' },
  { name: 'Feyenoord', slug: 'feyenoord', league: 'Eredivisie', leagueId: 88, apiId: 209, defaultNation: 'Netherlands' },
  { name: 'Benfica', slug: 'benfica', league: 'Primeira Liga', leagueId: 94, apiId: 211, defaultNation: 'Portugal' },
  { name: 'FC Porto', slug: 'fc-porto', league: 'Primeira Liga', leagueId: 94, apiId: 212, defaultNation: 'Portugal' },
  { name: 'Sporting CP', slug: 'sporting-cp', league: 'Primeira Liga', leagueId: 94, apiId: 228, defaultNation: 'Portugal' },
  { name: 'Al-Hilal', slug: 'al-hilal', league: 'Saudi Pro League', leagueId: 307, apiId: 2932, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Nassr', slug: 'al-nassr', league: 'Saudi Pro League', leagueId: 307, apiId: 2939, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Ittihad', slug: 'al-ittihad', league: 'Saudi Pro League', leagueId: 307, apiId: 2938, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Ahli', slug: 'al-ahli', league: 'Saudi Pro League', leagueId: 307, apiId: 2929, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Shabab', slug: 'al-shabab', league: 'Saudi Pro League', leagueId: 307, apiId: 2940, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Ettifaq', slug: 'al-ettifaq', league: 'Saudi Pro League', leagueId: 307, apiId: 2934, defaultNation: 'Saudi Arabia' },
  { name: 'Al-Qadsiah', slug: 'al-qadsiah', league: 'Saudi Pro League', leagueId: 307, apiId: 2933, defaultNation: 'Saudi Arabia' },
  { name: 'Boca Juniors', slug: 'boca-juniors', league: 'Liga Profesional Argentina', leagueId: 128, apiId: 451, defaultNation: 'Argentina' },
  { name: 'River Plate', slug: 'river-plate', league: 'Liga Profesional Argentina', leagueId: 128, apiId: 435, defaultNation: 'Argentina' },
  { name: 'Flamengo', slug: 'flamengo', league: 'Serie A', leagueId: 71, apiId: 127, defaultNation: 'Brazil' },
  { name: 'Palmeiras', slug: 'palmeiras', league: 'Serie A', leagueId: 71, apiId: 121, defaultNation: 'Brazil' },
  { name: 'Botafogo', slug: 'botafogo', league: 'Serie A', leagueId: 71, apiId: 120, defaultNation: 'Brazil' },
  { name: 'Corinthians', slug: 'corinthians', league: 'Serie A', leagueId: 71, apiId: 131, defaultNation: 'Brazil' },
  { name: 'Fluminense', slug: 'fluminense', league: 'Serie A', leagueId: 71, apiId: 124, defaultNation: 'Brazil' },
  { name: 'Grêmio', slug: 'gremio', league: 'Serie A', leagueId: 71, apiId: 130, defaultNation: 'Brazil' },
  { name: 'Santos', slug: 'santos', league: 'Serie A', leagueId: 71, apiId: 128, defaultNation: 'Brazil' },
  { name: 'São Paulo', slug: 'sao-paulo', league: 'Serie A', leagueId: 71, apiId: 126, defaultNation: 'Brazil' },
  { name: 'Vasco da Gama', slug: 'vasco-da-gama', league: 'Serie A', leagueId: 71, apiId: 133, defaultNation: 'Brazil' },
  { name: 'Atlético Mineiro', slug: 'atletico-mineiro', league: 'Serie A', leagueId: 71, apiId: 1062, defaultNation: 'Brazil' },
  { name: 'Galatasaray', slug: 'galatasaray', league: 'Süper Lig', leagueId: 203, apiId: 645, defaultNation: 'Turkey' },
  { name: 'Fenerbahçe', slug: 'fenerbahce', league: 'Süper Lig', leagueId: 203, apiId: 611, defaultNation: 'Turkey' },
  { name: 'Beşiktaş', slug: 'besiktas', league: 'Süper Lig', leagueId: 203, apiId: 549, defaultNation: 'Turkey' },
  { name: 'Trabzonspor', slug: 'trabzonspor', league: 'Süper Lig', leagueId: 203, apiId: 998, defaultNation: 'Turkey' },
  { name: 'Celtic', slug: 'celtic', league: 'Premiership', leagueId: 179, apiId: 247, defaultNation: 'Scotland' },
  { name: 'RSC Anderlecht', slug: 'anderlecht', league: 'Jupiler Pro League', leagueId: 144, apiId: 554, defaultNation: 'Belgium' },
  { name: 'Club Brugge', slug: 'club-brugge', league: 'Jupiler Pro League', leagueId: 144, apiId: 569, defaultNation: 'Belgium' },
  { name: 'Olympiacos', slug: 'olympiacos', league: 'Super League 1', leagueId: 197, apiId: 553, defaultNation: 'Greece' },
  { name: 'Panathinaikos', slug: 'panathinaikos', league: 'Super League 1', leagueId: 197, apiId: 617, defaultNation: 'Greece' },
  { name: 'FC Basel 1893', slug: 'fc-basel', league: 'Super League', leagueId: 207, apiId: 551, defaultNation: 'Switzerland' },
  { name: 'Red Bull Salzburg', slug: 'red-bull-salzburg', league: 'Bundesliga', leagueId: 218, apiId: 572, defaultNation: 'Austria' },
  { name: 'CF Monterrey', slug: 'monterrey', league: 'Liga MX', leagueId: 262, apiId: 2282, defaultNation: 'Mexico' },
  { name: 'Inter Miami', slug: 'inter-miami', league: 'Major League Soccer', leagueId: 253, apiId: 9568, defaultNation: 'USA' },
  { name: 'LA Galaxy', slug: 'la-galaxy', league: 'Major League Soccer', leagueId: 253, apiId: 1605, defaultNation: 'USA' },
  { name: 'Los Angeles FC', slug: 'lafc', league: 'Major League Soccer', leagueId: 253, apiId: 1616, defaultNation: 'USA' },
  { name: 'Orlando City SC', slug: 'orlando-city', league: 'Major League Soccer', leagueId: 253, apiId: 1599, defaultNation: 'USA' },
  { name: 'Vancouver Whitecaps', slug: 'vancouver-whitecaps', league: 'Major League Soccer', leagueId: 253, apiId: 1603, defaultNation: 'Canada' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePosition(rawPos) {
  if (!rawPos) return 'CM';
  const p = rawPos.toLowerCase().trim();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('defender')) return 'CB';
  if (p.includes('midfielder')) return 'CM';
  if (p.includes('attacker') || p.includes('forward')) return 'ST';
  return 'CM';
}

function computeTier(rating) {
  if (rating >= 91) return 'ULTIMATE';
  if (rating >= 86) return 'MASTER';
  if (rating >= 81) return 'ELITE';
  if (rating >= 74) return 'GOLD';
  if (rating >= 64) return 'SILVER';
  return 'BRONZE';
}

export function loadReferenceDatabase() {
  const refMap = {};

  // 1. Primary: load cached reference players index
  const refFilePath = path.join(ROOT, 'data', 'reference_players.json');
  if (fs.existsSync(refFilePath)) {
    try {
      const savedRef = JSON.parse(fs.readFileSync(refFilePath, 'utf8'));
      for (const [id, data] of Object.entries(savedRef)) {
        if (data.nation !== 'Israel') {
          refMap[id] = data;
        }
      }
    } catch (_) {}
  }

  // 2. Scan all squads (top 5, global, legends)
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.name.endsWith('.json')) {
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          const players = content.players || (Array.isArray(content) ? content : []);
          for (const p of players) {
            if (p.nation === 'Israel') continue;
            if (p.apiId && !refMap[p.apiId]) {
              refMap[p.apiId] = {
                name: p.name,
                nation: p.nation,
                rating: typeof p.rating === 'number' ? p.rating : undefined,
                tier: p.tier,
                position: p.position,
              };
            }
          }
        } catch (_) {}
      }
    }
  }

  scanDir(path.join(ROOT, 'data', 'players', 'active'));
  scanDir(path.join(ROOT, 'data', 'players', 'legends'));

  return refMap;
}

async function checkAccountQuota() {
  const res = await fetch(`${BASE_URL}/status`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const data = await res.json();
  
  if (data.errors && data.errors.requests) {
    return { current: 100, limit_day: 100, blocked: true, error: data.errors.requests };
  }
  
  const req = data.response?.requests;
  if (req && typeof req.current === 'number') {
    return { current: req.current, limit_day: req.limit_day, blocked: req.current >= req.limit_day };
  }
  
  return { current: 100, limit_day: 100, blocked: true, error: 'Quota unavailable' };
}

async function fetchSquad(teamId, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/players/squads?team=${teamId}`, {
        headers: { 'x-apisports-key': API_KEY },
      });

      if (res.status === 429) {
        console.warn('   ⏳ Rate limit (429) reached. Waiting 15s before retry...');
        await sleep(15000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data.response?.[0]?.players || [];
    } catch (err) {
      if (attempt < retries) {
        console.warn(`   ⚠️ Fetch failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in 8s...`);
        await sleep(8000);
      } else {
        throw err;
      }
    }
  }
}

export async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : undefined;

  const totalClubs = GLOBAL_42_CLUBS.length;
  const endIdx = limit ? Math.min(startIdx + limit, totalClubs) : totalClubs;
  const clubsToProcess = GLOBAL_42_CLUBS.slice(startIdx, endIdx);

  console.log('════════════════════════════════════════════════════════════════');
  console.log('🌍 42 Global Clubs Squad Fetch Pipeline');
  console.log(`📋 Total Target Clubs: ${totalClubs}`);
  console.log(`🎯 Processing Range: [${startIdx} → ${endIdx - 1}] (${clubsToProcess.length} clubs)`);
  console.log(`⏱️  Spacing: ${DELAY_MS / 1000}s between calls`);
  console.log('════════════════════════════════════════════════════════════════\n');

  // 1. Quota Check
  console.log('📡 Checking API quota status...');
  const quota = await checkAccountQuota();
  const remaining = quota.limit_day - quota.current;
  console.log(`   Requests Used Today: ${quota.current} / ${quota.limit_day}`);
  console.log(`   Requests Remaining:  ${remaining}\n`);

  if (remaining < clubsToProcess.length && !dryRun && !force) {
    console.error(`❌ Insufficient quota! Need ${clubsToProcess.length} requests, but only ${remaining} remaining today.`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('🧪 DRY RUN MODE ENABLED:');
    console.log(`   Target: ${clubsToProcess.length} global clubs.`);
    clubsToProcess.forEach((c, idx) => console.log(`   [${idx + 1}] ${c.name} (apiId: ${c.apiId}, ${c.league})`));
    console.log('\n✅ Dry run completed successfully.');
    return;
  }

  // 2. Load Reference Database
  console.log('📚 Loading reference player database for nation & rating enrichment...');
  const refMap = loadReferenceDatabase();
  console.log(`   ✅ Loaded ${Object.keys(refMap).length} known players in reference index.\n`);

  const globalDir = path.join(ROOT, 'data', 'players', 'active', 'global');
  fs.mkdirSync(globalDir, { recursive: true });

  let successCount = 0;
  let totalPlayersCount = 0;
  let enrichedCount = 0;
  let newCount = 0;
  let filteredIsraeli = 0;

  // 3. Fetch Execution Loop
  for (let i = 0; i < clubsToProcess.length; i++) {
    const club = clubsToProcess[i];
    const globalIdx = startIdx + i + 1;
    const outFile = path.join(globalDir, `${club.slug}.json`);

    // Load existing squad if file already exists (to preserve calibrated ratings)
    const existingSquadPlayers = {};
    if (fs.existsSync(outFile)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(outFile, 'utf8'));
        const pList = existingData.players || [];
        for (const p of pList) {
          if (p.apiId) existingSquadPlayers[p.apiId] = p;
        }
      } catch (_) {}
    }

    console.log(`[${globalIdx}/${totalClubs}] 📡 Fetching ${club.name} (API ID: ${club.apiId}, ${club.league})...`);

    try {
      const rawPlayers = await fetchSquad(club.apiId);

      if (!rawPlayers || rawPlayers.length === 0) {
        console.warn(`   ⚠️  No players returned for ${club.name}`);
        continue;
      }

      const players = [];
      for (const p of rawPlayers) {
        const apiId = p.id;
        const existing = existingSquadPlayers[apiId];
        const ref = refMap[apiId];

        // Check if Israeli player -> skip/filter
        const nation = existing?.nation || ref?.nation || club.defaultNation || 'Unknown';
        if (nation === 'Israel') {
          filteredIsraeli++;
          continue;
        }

        const kit = p.number ? parseInt(p.number, 10) : (existing?.kitNumber ?? undefined);
        const position = existing?.position || ref?.position || normalizePosition(p.position);
        const rating = existing?.rating || ref?.rating || (kit && kit <= 11 ? 77 : 72);
        const tier = existing?.tier || ref?.tier || computeTier(rating);
        const name = p.name ? p.name.trim() : (existing?.name || 'Unknown Player');

        if (existing || ref) enrichedCount++;
        else newCount++;

        players.push({
          apiId,
          name,
          position,
          club: club.name,
          nation,
          tier,
          rating,
          isLegend: false,
          imageUrl: p.photo || `https://media.api-sports.io/football/players/${apiId}.png`,
          kitNumber: kit,
        });
      }

      const payload = {
        club: {
          apiId: club.apiId,
          name: club.name,
          logo: `https://media.api-sports.io/football/teams/${club.apiId}.png`,
          league: club.league,
          leagueId: club.leagueId,
        },
        players,
      };

      fs.writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf8');

      successCount++;
      totalPlayersCount += players.length;
      console.log(`   ✅ Saved ${players.length} players to ${path.relative(ROOT, outFile)}`);

      // Rate limit delay between calls (except after the last one)
      if (i < clubsToProcess.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      console.error(`   ❌ Failed to fetch/save ${club.name}: ${err.message}`);
    }
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('🎉 Global Squad Fetch Finished!');
  console.log(`📊 Successful Clubs: ${successCount} / ${clubsToProcess.length}`);
  console.log(`⚽ Total Players Processed: ${totalPlayersCount}`);
  console.log(`✨ Enriched Players (Known): ${enrichedCount}`);
  console.log(`🆕 Newly Discovered Players: ${newCount}`);
  if (filteredIsraeli > 0) {
    console.log(`🚫 Filtered Israeli Players: ${filteredIsraeli}`);
  }
  console.log('════════════════════════════════════════════════════════════════\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((err) => {
    console.error('Fatal pipeline error:', err);
    process.exit(1);
  });
}
