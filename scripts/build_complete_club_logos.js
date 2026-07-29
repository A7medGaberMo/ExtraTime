const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'data', 'players', 'active');
const clubLogoMap = {};

// Helper to add clean mappings
function addClub(name, logo) {
  if (!name || !logo) return;
  const cleanName = name.trim();
  clubLogoMap[cleanName] = logo;
  // Also add lowercase normalized key
  const normKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
  clubLogoMap[normKey] = logo;
}

// 1. Scan all JSON files in data/players/active
if (fs.existsSync(baseDir)) {
  const leagues = fs.readdirSync(baseDir);
  for (const league of leagues) {
    const leaguePath = path.join(baseDir, league);
    if (!fs.statSync(leaguePath).isDirectory()) continue;

    const files = fs.readdirSync(leaguePath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(leaguePath, file), 'utf-8'));
        if (data.club && data.club.name && data.club.logo) {
          addClub(data.club.name, data.club.logo);
        }
      } catch (e) {}
    }
  }
}

// 2. Add extra famous global clubs & aliases
const GLOBAL_CLUBS = {
  // Turkey
  'Galatasaray': 'https://media.api-sports.io/football/teams/645.png',
  'Fenerbahce': 'https://media.api-sports.io/football/teams/611.png',
  'Fenerbahçe': 'https://media.api-sports.io/football/teams/611.png',
  'Besiktas': 'https://media.api-sports.io/football/teams/549.png',
  'Beşiktaş': 'https://media.api-sports.io/football/teams/549.png',

  // Portugal
  'Benfica': 'https://media.api-sports.io/football/teams/211.png',
  'Porto': 'https://media.api-sports.io/football/teams/212.png',
  'FC Porto': 'https://media.api-sports.io/football/teams/212.png',
  'Sporting CP': 'https://media.api-sports.io/football/teams/228.png',
  'Sporting Lisbon': 'https://media.api-sports.io/football/teams/228.png',

  // Brazil & Argentina
  'Flamengo': 'https://media.api-sports.io/football/teams/127.png',
  'Palmeiras': 'https://media.api-sports.io/football/teams/121.png',
  'River Plate': 'https://media.api-sports.io/football/teams/435.png',
  'Boca Juniors': 'https://media.api-sports.io/football/teams/451.png',

  // MLS & Saudi Pro League
  'Inter Miami': 'https://media.api-sports.io/football/teams/1598.png',
  'Inter Miami CF': 'https://media.api-sports.io/football/teams/1598.png',
  'Al-Nassr': 'https://media.api-sports.io/football/teams/2506.png',
  'Al Nassr': 'https://media.api-sports.io/football/teams/2506.png',
  'Al-Hilal': 'https://media.api-sports.io/football/teams/2501.png',
  'Al Hilal': 'https://media.api-sports.io/football/teams/2501.png',
  'Al-Ahli': 'https://media.api-sports.io/football/teams/2502.png',
  'Al Ahli': 'https://media.api-sports.io/football/teams/2502.png',
  'Al-Ittihad': 'https://media.api-sports.io/football/teams/2503.png',
  'Al Ittihad': 'https://media.api-sports.io/football/teams/2503.png',

  // Netherlands & Others
  'Ajax': 'https://media.api-sports.io/football/teams/194.png',
  'PSV': 'https://media.api-sports.io/football/teams/197.png',
  'Feyenoord': 'https://media.api-sports.io/football/teams/247.png',
  'Club Brugge': 'https://media.api-sports.io/football/teams/569.png',
  'Celtic': 'https://media.api-sports.io/football/teams/247.png'
};

for (const [name, logo] of Object.entries(GLOBAL_CLUBS)) {
  addClub(name, logo);
}

console.log(`Generated ${Object.keys(clubLogoMap).length} club logo mapping entries.`);

// Write mapping to JSON or TS file
const outputPath = path.join(__dirname, '..', 'src', 'lib', 'clubLogos.json');
fs.writeFileSync(outputPath, JSON.stringify(clubLogoMap, null, 2));
console.log(`Saved club logos map to src/lib/clubLogos.json`);
