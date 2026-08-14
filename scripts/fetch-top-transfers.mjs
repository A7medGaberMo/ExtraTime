import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const keys = (process.env.API_FOOTBALL_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);
const host = process.env.API_FOOTBALL_HOST || 'v3.football.api-sports.io';

let currentKeyIndex = 0;
function getKey() {
  return keys[currentKeyIndex % keys.length];
}
function rotateKey() {
  currentKeyIndex++;
  console.log(`Rotated to key index ${currentKeyIndex % keys.length}`);
}

async function fetchTeamTransfers(teamId) {
  let attempts = 0;
  while (attempts < keys.length) {
    const key = getKey();
    const url = `https://${host}/transfers?team=${teamId}`;
    try {
      const res = await fetch(url, {
        headers: {
          'x-apisports-key': key,
          'x-rapidapi-host': host
        }
      });
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        rotateKey();
        attempts++;
        continue;
      }
      return data.response || [];
    } catch (e) {
      rotateKey();
      attempts++;
    }
  }
  return [];
}

const TOP_TEAMS = [
  // Premier League
  { id: 40, name: 'Liverpool' },
  { id: 50, name: 'Manchester City' },
  { id: 42, name: 'Arsenal' },
  { id: 49, name: 'Chelsea' },
  { id: 33, name: 'Manchester United' },
  { id: 47, name: 'Tottenham Hotspur' },
  // La Liga
  { id: 541, name: 'Real Madrid' },
  { id: 529, name: 'FC Barcelona' },
  { id: 530, name: 'Atletico Madrid' },
  // Serie A
  { id: 505, name: 'Inter Milan' },
  { id: 496, name: 'Juventus' },
  { id: 489, name: 'AC Milan' },
  { id: 492, name: 'SSC Napoli' },
  // Bundesliga
  { id: 157, name: 'Bayern Munich' },
  { id: 165, name: 'Borussia Dortmund' },
  { id: 168, name: 'Bayer Leverkusen' },
  // Ligue 1
  { id: 85, name: 'Paris Saint-Germain' },
  // Global
  { id: 645, name: 'Galatasaray' },
  { id: 611, name: 'Fenerbahce' },
  { id: 549, name: 'Besiktas' },
  { id: 610, name: 'Trabzonspor' },
  { id: 2939, name: 'Al-Nassr' },
  { id: 2932, name: 'Al-Hilal' },
  { id: 9568, name: 'Inter Miami' }
];

async function main() {
  console.log('🔍 Fetching latest transfers for top teams up to August 2026...\n');
  const recentTransfers = [];

  for (const team of TOP_TEAMS) {
    console.log(`Fetching transfers for ${team.name} (id: ${team.id})...`);
    const resp = await fetchTeamTransfers(team.id);
    for (const item of resp) {
      const player = item.player;
      for (const t of (item.transfers || [])) {
        // Check transfers from 2025/2026
        if (t.date && t.date >= '2025-01-01') {
          recentTransfers.push({
            playerId: player.id,
            playerName: player.name,
            date: t.date,
            type: t.type,
            from: t.teams.out?.name || 'Unknown',
            fromId: t.teams.out?.id,
            to: t.teams.in?.name || 'Unknown',
            toId: t.teams.in?.id
          });
        }
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nFound ${recentTransfers.length} transfers in 2025-2026:`);
  console.log(JSON.stringify(recentTransfers, null, 2));

  fs.writeFileSync('scratch/recent_transfers_2026.json', JSON.stringify(recentTransfers, null, 2));
}

main().catch(console.error);
