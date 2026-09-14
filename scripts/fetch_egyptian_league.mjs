import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const API_KEY = process.env.FOOTBALL_API_KEY || '80b6323c921cda2a6fb58ec3aabf1f90';
const BASE_URL = 'https://v3.football.api-sports.io';
const DELAY_MS = 6500; // 6.5s delay to stay comfortably under the 10 req/min limit
const OUTPUT_DIR = path.join(ROOT, 'data', 'players', 'active', 'egyptian-premier-league');

// All 18 Egyptian Premier League Clubs (Season 2024-2026)
export const EGYPTIAN_CLUBS = [
  { name: 'Al Ahly', slug: 'al-ahly', apiId: 1577 },
  { name: 'Zamalek SC', slug: 'zamalek', apiId: 1040 },
  { name: 'Pyramids FC', slug: 'pyramids', apiId: 1036 },
  { name: 'Al Masry', slug: 'al-masry', apiId: 1031 },
  { name: 'Ismaily SC', slug: 'ismaily', apiId: 1030 },
  { name: 'Al Ittihad Alexandria', slug: 'al-ittihad-alexandria', apiId: 1572 },
  { name: 'Modern Sport', slug: 'modern-sport', apiId: 16431 },
  { name: 'Ceramica Cleopatra', slug: 'ceramica-cleopatra', apiId: 14651 },
  { name: 'Smouha SC', slug: 'smouha', apiId: 1044 },
  { name: 'ENPPI', slug: 'enppi', apiId: 1037 },
  { name: 'Tala\'ea El Gaish', slug: 'talaea-el-gaish', apiId: 1039 },
  { name: 'National Bank of Egypt', slug: 'national-bank', apiId: 15570 },
  { name: 'Pharco FC', slug: 'pharco', apiId: 15736 },
  { name: 'El Gouna FC', slug: 'el-gouna', apiId: 1574 },
  { name: 'Ghazl El Mahalla', slug: 'ghazl-el-mahalla', apiId: 13819 },
  { name: 'Haras El Hodood', slug: 'haras-el-hodoud', apiId: 1576 },
  { name: 'Petrojet', slug: 'petrojet', apiId: 1041 },
  { name: 'ZED FC', slug: 'zed-fc', apiId: 7520 },
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getTier(rating) {
  if (rating >= 91) return 'ULTIMATE';
  if (rating >= 86) return 'MASTER';
  if (rating >= 81) return 'ELITE';
  if (rating >= 74) return 'GOLD';
  if (rating >= 64) return 'SILVER';
  return 'BRONZE';
}

function normalizePosition(rawPos) {
  if (!rawPos) return 'CM';
  const pos = rawPos.toLowerCase();
  if (pos.includes('goal') || pos === 'gk') return 'GK';
  if (pos.includes('def') || pos === 'cb') return 'CB';
  if (pos.includes('mid') || pos === 'cm') return 'CM';
  if (pos.includes('att') || pos === 'st') return 'ST';
  return 'CM';
}

// Known Egyptian League Star Overrides
const STAR_CALIBRATION = {
  // Al Ahly
  'Mohamed El Shenawy': { rating: 82, pos: 'GK', nation: 'Egypt' },
  'Mostafa Shobeir': { rating: 79, pos: 'GK', nation: 'Egypt' },
  'Hamza Alaa': { rating: 74, pos: 'GK', nation: 'Egypt' },
  'Emam Ashour': { rating: 83, pos: 'CM', nation: 'Egypt' },
  'Marwan Attia': { rating: 82, pos: 'CDM', nation: 'Egypt' },
  'Wessam Abou Ali': { rating: 82, pos: 'ST', nation: 'Palestine' },
  'Percy Tau': { rating: 81, pos: 'RW', nation: 'South Africa' },
  'Ali Maaloul': { rating: 81, pos: 'LB', nation: 'Tunisia' },
  'Yahia Attiyat Allah': { rating: 81, pos: 'LB', nation: 'Morocco' },
  'Hussein El Shahat': { rating: 80, pos: 'LW', nation: 'Egypt' },
  'Akram Tawfik': { rating: 79, pos: 'RB', nation: 'Egypt' },
  'Mohamed Magdy Afsha': { rating: 79, pos: 'CAM', nation: 'Egypt' },
  'Mohamed Magdi Kafsha': { rating: 79, pos: 'CAM', nation: 'Egypt' },
  'Reda Slim': { rating: 79, pos: 'RW', nation: 'Morocco' },
  'Yasser Ibrahim': { rating: 78, pos: 'CB', nation: 'Egypt' },
  'Ramy Rabia': { rating: 78, pos: 'CB', nation: 'Egypt' },
  'Mohamed Hany': { rating: 78, pos: 'RB', nation: 'Egypt' },
  'Taher Mohamed': { rating: 78, pos: 'LW', nation: 'Egypt' },
  'Taher Mohamed Taher': { rating: 78, pos: 'LW', nation: 'Egypt' },
  'Mahmoud Kahraba': { rating: 78, pos: 'ST', nation: 'Egypt' },
  'Karim Fouad': { rating: 77, pos: 'RW', nation: 'Egypt' },
  'Karim El Debes': { rating: 74, pos: 'LB', nation: 'Egypt' },
  'Ahmed Reda': { rating: 74, pos: 'CB', nation: 'Egypt' },
  'Y. Belammari': { rating: 77, pos: 'LB', nation: 'Morocco' },
  'Ahmed Eid': { rating: 75, pos: 'RB', nation: 'Egypt' },
  'Amr El Gazar': { rating: 74, pos: 'CB', nation: 'Egypt' },
  'Omar El Saeey': { rating: 75, pos: 'CM', nation: 'Egypt' },
  'A. Bencharki': { rating: 79, pos: 'LW', nation: 'Morocco' },
  'S. Benjdida': { rating: 76, pos: 'ST', nation: 'Morocco' },

  // Zamalek SC
  'Zizo': { rating: 83, pos: 'RW', nation: 'Egypt' },
  'Ahmed Sayed Zizo': { rating: 83, pos: 'RW', nation: 'Egypt' },
  'Ahmed Abou El Fotouh': { rating: 80, pos: 'LB', nation: 'Egypt' },
  'Abdallah El Said': { rating: 79, pos: 'CAM', nation: 'Egypt' },
  'Abdalla El Said': { rating: 79, pos: 'CAM', nation: 'Egypt' },
  'Nabil Emad Dunga': { rating: 79, pos: 'CDM', nation: 'Egypt' },
  'Mahmoud Hamdi El Wensh': { rating: 79, pos: 'CB', nation: 'Egypt' },
  'Seifeddine Jaziri': { rating: 79, pos: 'ST', nation: 'Tunisia' },
  'Hamza Mathlouthi': { rating: 78, pos: 'CB', nation: 'Tunisia' },
  'Shikabala': { rating: 78, pos: 'RW', nation: 'Egypt' },
  'Nasser Maher': { rating: 78, pos: 'CAM', nation: 'Egypt' },
  'Mohamed Awad': { rating: 78, pos: 'GK', nation: 'Egypt' },
  'Mohamed Sobhi': { rating: 77, pos: 'GK', nation: 'Egypt' },
  'Mostafa Shalaby': { rating: 78, pos: 'LW', nation: 'Egypt' },
  'Hossam Abdelmaguid': { rating: 78, pos: 'CB', nation: 'Egypt' },
  'Mohamed Shehata': { rating: 77, pos: 'CM', nation: 'Egypt' },
  'Ahmed Hamdi': { rating: 77, pos: 'CM', nation: 'Egypt' },
  'Ziad Kamal': { rating: 76, pos: 'CM', nation: 'Egypt' },
  'M. Bentayg': { rating: 77, pos: 'LB', nation: 'Morocco' },
  'Omar Gaber': { rating: 77, pos: 'RB', nation: 'Egypt' },
  'Mostafa El Zenary': { rating: 75, pos: 'CB', nation: 'Egypt' },
  'Al Mahdi Soliman': { rating: 75, pos: 'GK', nation: 'Egypt' },
  'Nasser Mansi': { rating: 76, pos: 'ST', nation: 'Egypt' },

  // Pyramids FC
  'Ibrahim Adel': { rating: 81, pos: 'LW', nation: 'Egypt' },
  'Mostafa Fathi': { rating: 81, pos: 'RW', nation: 'Egypt' },
  'Ramadan Sobhi': { rating: 81, pos: 'LW', nation: 'Egypt' },
  'Blati Touré': { rating: 81, pos: 'CDM', nation: 'Burkina Faso' },
  'Fiston Mayele': { rating: 81, pos: 'ST', nation: 'DR Congo' },
  'Mohamed Chibi': { rating: 81, pos: 'RB', nation: 'Morocco' },
  'M. Chibi': { rating: 81, pos: 'RB', nation: 'Morocco' },
  'Walid El Karti': { rating: 80, pos: 'CM', nation: 'Morocco' },
  'Ahmed El Shenawy': { rating: 79, pos: 'GK', nation: 'Egypt' },
  'Mohanad Lasheen': { rating: 78, pos: 'CDM', nation: 'Egypt' },
  'Osama Galal': { rating: 78, pos: 'CB', nation: 'Egypt' },
  'Fagrie Lakay': { rating: 78, pos: 'ST', nation: 'South Africa' },
  'Ahmed Samy': { rating: 77, pos: 'CB', nation: 'Egypt' },
  'Karim Hafez': { rating: 77, pos: 'LB', nation: 'Egypt' },
  'Eyad El Askalany': { rating: 76, pos: 'CB', nation: 'Egypt' },
  'Mahmoud Zalaka': { rating: 76, pos: 'LW', nation: 'Egypt' },
  'Dodo Elgabbas': { rating: 74, pos: 'ST', nation: 'Egypt' },
  'M. Gad': { rating: 76, pos: 'GK', nation: 'Egypt' },

  // Other League Stars
  'Baher El Mohamady': { rating: 77, pos: 'CB', nation: 'Egypt' },
  'John Ebuka': { rating: 77, pos: 'ST', nation: 'Nigeria' },
  'Sodiq Awujoola': { rating: 77, pos: 'LW', nation: 'Nigeria' },
  'Ahmed Yasser Rayyan': { rating: 77, pos: 'ST', nation: 'Egypt' },
  'Mohamed Bassam': { rating: 77, pos: 'GK', nation: 'Egypt' },
  'Mohamed Shamy': { rating: 76, pos: 'ST', nation: 'Egypt' },
  'Mido Gaber': { rating: 76, pos: 'RW', nation: 'Egypt' },
  'Mahmoud Gad': { rating: 76, pos: 'GK', nation: 'Egypt' },
  'Mohamed Helal': { rating: 76, pos: 'CAM', nation: 'Egypt' },
  'Ahmed Sayed Abdel Nabi': { rating: 75, pos: 'RB', nation: 'Egypt' },
  'Ghanam Mohamed': { rating: 76, pos: 'CM', nation: 'Egypt' },
  'Ali Zaazaa': { rating: 75, pos: 'CM', nation: 'Egypt' },
  'Arnold Eba': { rating: 75, pos: 'ST', nation: 'Cameroon' },
  'Yaw Annor': { rating: 76, pos: 'RW', nation: 'Togo' },
  'Mabululu': { rating: 79, pos: 'ST', nation: 'Angola' },
};

// Known Foreign Player Nationalities
const FOREIGN_PLAYERS = {
  'Wessam Abou Ali': 'Palestine',
  'Percy Tau': 'South Africa',
  'Ali Maaloul': 'Tunisia',
  'Yahia Attiyat Allah': 'Morocco',
  'Reda Slim': 'Morocco',
  'Y. Belammari': 'Morocco',
  'A. Bencharki': 'Morocco',
  'S. Benjdida': 'Morocco',
  'M. Bentayg': 'Morocco',
  'Seifeddine Jaziri': 'Tunisia',
  'Hamza Mathlouthi': 'Tunisia',
  'Blati Touré': 'Burkina Faso',
  'Fiston Mayele': 'DR Congo',
  'Mohamed Chibi': 'Morocco',
  'M. Chibi': 'Morocco',
  'Walid El Karti': 'Morocco',
  'Fagrie Lakay': 'South Africa',
  'John Ebuka': 'Nigeria',
  'Sodiq Awujoola': 'Nigeria',
  'Yaw Annor': 'Togo',
  'Mabululu': 'Angola',
  'Arnold Eba': 'Cameroon',
  'Eric Traoré': 'Burkina Faso',
  'Benson Shilongo': 'Namibia',
};

async function fetchSquadForClub(club) {
  console.log(`\n⏳ Fetching squad for ${club.name} (API ID: ${club.apiId})...`);
  const url = `${BASE_URL}/players/squads?team=${club.apiId}`;
  
  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY }
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.response || data.response.length === 0) {
    console.warn(`⚠️ No squad data returned for ${club.name}`);
    return null;
  }

  const teamData = data.response[0].team;
  const rawPlayers = data.response[0].players || [];

  console.log(`✓ Received ${rawPlayers.length} raw players for ${club.name}.`);

  const players = [];

  for (const p of rawPlayers) {
    const rawPos = normalizePosition(p.position);
    let rating = 74; // Default starting rating for Egyptian league senior players
    let pos = rawPos;
    let nation = FOREIGN_PLAYERS[p.name] || 'Egypt';

    // Check specific known star calibrations
    if (STAR_CALIBRATION[p.name]) {
      const star = STAR_CALIBRATION[p.name];
      rating = star.rating;
      if (star.pos) pos = star.pos;
      if (star.nation) nation = star.nation;
    } else {
      // General realistic tiering for Egyptian League
      if (p.id > 400000 || (p.age && p.age <= 20)) {
        rating = 66; // SILVER youth
      } else if (p.id > 300000 || (p.age && p.age <= 22)) {
        rating = 71; // Developing youngster
      } else {
        // Regular senior starter/rotation
        if ([1577, 1040, 1036].includes(club.apiId)) {
          rating = 76;
        } else {
          rating = 74;
        }
      }
    }

    // Israeli filter check
    if (nation.toLowerCase().includes('israel') || nation.toLowerCase() === 'isr') {
      continue;
    }

    const tier = getTier(rating);

    players.push({
      apiId: p.id,
      name: p.name,
      position: pos,
      club: club.name,
      nation: nation,
      tier: tier,
      rating: rating,
      isLegend: false,
      imageUrl: p.photo || `https://media.api-sports.io/football/players/${p.id}.png`,
      kitNumber: p.number ?? null,
    });
  }

  return {
    club: {
      apiId: club.apiId,
      name: club.name,
      logo: teamData.logo || `https://media.api-sports.io/football/teams/${club.apiId}.png`,
      league: 'Egyptian Premier League',
      leagueId: 233,
    },
    players: players,
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }

  console.log(`🚀 Starting fetch for all ${EGYPTIAN_CLUBS.length} Egyptian Premier League clubs...`);
  console.log(`⏱️ Spacing: ${DELAY_MS}ms per request to ensure 100% reliability.\n`);

  let successCount = 0;

  for (let i = 0; i < EGYPTIAN_CLUBS.length; i++) {
    const club = EGYPTIAN_CLUBS[i];
    const outputFile = path.join(OUTPUT_DIR, `${club.slug}.json`);

    try {
      const squad = await fetchSquadForClub(club);
      if (squad && squad.players.length > 0) {
        fs.writeFileSync(outputFile, JSON.stringify(squad, null, 2), 'utf-8');
        console.log(`💾 Saved ${squad.players.length} players to ${club.slug}.json`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error fetching ${club.name}:`, err.message);
    }

    if (i < EGYPTIAN_CLUBS.length - 1) {
      console.log(`⏳ Waiting ${DELAY_MS / 1000}s before next request...`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🎉 Successfully fetched ${successCount} / ${EGYPTIAN_CLUBS.length} Egyptian Premier League clubs!`);
}

main().catch(err => {
  console.error('Fatal error in fetch script:', err);
  process.exit(1);
});
