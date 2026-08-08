import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const leagueArg = process.argv[2];
if (!leagueArg) {
  console.error("Usage: node scrape-league-stats.mjs <league-dir>");
  console.error("Examples: premier-league, la-liga, serie-a, bundesliga, ligue-1, global");
  process.exit(1);
}

const PLAYERS_DIR = path.join(process.cwd(), 'data', 'players', 'active', leagueArg);
const OUT_DIR = path.join(process.cwd(), 'data', 'stats', 'active', leagueArg);

// Track consecutive 429s to implement exponential backoff
let consecutive429s = 0;

async function fetchWithRetry(url, options) {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);

      if (res.status === 429) {
        consecutive429s++;
        // Exponential backoff: 15s, 30s, 60s, 120s...
        const backoff = Math.min(15000 * Math.pow(2, consecutive429s - 1), 120000);
        console.log(`[RATE LIMIT] 429 (attempt ${attempt}, streak ${consecutive429s}). Sleeping ${backoff / 1000}s...`);
        await new Promise(r => setTimeout(r, backoff));
        if (attempt > 8) {
          console.log(`[GIVE UP] Too many 429s for ${url}`);
          return null;
        }
        continue;
      }
      consecutive429s = 0; // Reset on success
      return res;
    } catch (e) {
      if (e.name === 'AbortError' || e.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.log(`[TIMEOUT] Attempt ${attempt} timed out. Retrying in 5s...`);
        await new Promise(r => setTimeout(r, 5000));
        if (attempt > 5) {
          console.log(`[GIVE UP] Too many timeouts for ${url}`);
          return null;
        }
        continue;
      }
      if (attempt > 5) {
        console.log(`[GIVE UP] Fetch failed after ${attempt} attempts: ${e.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

async function getWikipediaPageTitle(playerName, clubName) {
  // Strip initials like "B. Saka" -> "Saka" for better Wikipedia search
  const cleanName = playerName.replace(/^[A-Z]\.\s*/i, '');
  const query = encodeURIComponent(`${cleanName} ${clubName}`);
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`;
  const headers = { 'User-Agent': 'ExtraTimeBot/1.0 (contact@example.com)' };
  try {
    const res = await fetchWithRetry(url, { headers });
    if (!res) return null;
    const data = await res.json();
    if (data.query && data.query.search && data.query.search.length > 0) {
      return data.query.search[0].title;
    }
  } catch (e) {
    console.error(`Error searching for ${playerName}: ${e.message}`);
  }
  return null;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function scrapePlayer(player, clubFile) {
  const clubSlug = clubFile.replace('.json', '');
  const playerSlug = slugify(player.name);
  const outDir = path.join(OUT_DIR, clubSlug);
  const outFile = path.join(outDir, `${playerSlug}.json`);
  
  try {
    await fs.access(outFile);
    return; // Silently skip already-scraped players
  } catch (e) {
    // File doesn't exist, proceed
  }

  const title = await getWikipediaPageTitle(player.name, player.club);
  if (!title) {
    console.log(`[MISS] ${player.name} (${clubSlug})`);
    return;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
  const headers = { 'User-Agent': 'ExtraTimeBot/1.0 (contact@example.com)' };
  let html;
  try {
    const res = await fetchWithRetry(url, { headers });
    if (!res || !res.ok) {
      console.log(`[MISS] ${player.name} - failed to fetch HTML`);
      return;
    }
    html = await res.text();
  } catch (e) {
    console.log(`[ERROR] ${player.name}: ${e.message}`);
    return;
  }

  const $ = cheerio.load(html);
  
  let clubMap = new Map();
  let nationalMap = new Map();
  let careerTotal = { appearances: 0, goals: 0 };
  let currentClub = null;
  let currentNation = null;
  let clubFound = false;

  $('table.wikitable').each((i, table) => {
    const text = $(table).text();
    
    const isClubTable = text.includes('Appearances and goals by club, season and competition') || (text.includes('Club') && text.includes('Season'));
    const isNationalTable = text.includes('Appearances and goals by national team and year') || (text.includes('National team') && text.includes('Year'));

    if (isClubTable) {
      clubFound = true;
      $(table).find('tr').each((j, tr) => {
        let cells = $(tr).find('th, td').map((k, el) => $(el).text().trim().replace(/\[.*?\]/g, '').replace(/,/g, '')).get();
        if (cells.length < 5) return;

        let firstCell = cells[0];
        
        if (firstCell.toLowerCase().includes('total')) return;
        if (firstCell === 'Club' || firstCell === 'Division' || firstCell.toLowerCase().includes('season')) return;

        let isSeasonFirst = /^\d{4}/.test(firstCell);
        
        if (!isSeasonFirst) {
          currentClub = firstCell.replace(/\s*\(loan\)\s*/i, '');
        }

        if (currentClub) {
          let appsStr = cells[cells.length - 2];
          let goalsStr = cells[cells.length - 1];
          let apps = parseInt(appsStr) || 0;
          let goals = parseInt(goalsStr) || 0;
          
          if (!clubMap.has(currentClub)) {
            clubMap.set(currentClub, { appearances: 0, goals: 0 });
          }
          let stats = clubMap.get(currentClub);
          stats.appearances += apps;
          stats.goals += goals;
          careerTotal.appearances += apps;
          careerTotal.goals += goals;
        }
      });
    }

    if (isNationalTable) {
      $(table).find('tr').each((j, tr) => {
        let cells = $(tr).find('th, td').map((k, el) => $(el).text().trim().replace(/\[.*?\]/g, '').replace(/,/g, '')).get();
        if (cells.length < 3) return;

        let firstCell = cells[0];
        
        if (firstCell.toLowerCase().includes('total')) return;
        if (firstCell === 'National team' || firstCell === 'Year') return;

        let isSeasonFirst = /^\d{4}/.test(firstCell);
        
        if (!isSeasonFirst) {
          currentNation = firstCell;
        }

        if (currentNation) {
          let appsStr = cells[cells.length - 2];
          let goalsStr = cells[cells.length - 1];
          let apps = parseInt(appsStr) || 0;
          let goals = parseInt(goalsStr) || 0;
          
          if (!nationalMap.has(currentNation)) {
            nationalMap.set(currentNation, { appearances: 0, goals: 0 });
          }
          let stats = nationalMap.get(currentNation);
          stats.appearances += apps;
          stats.goals += goals;
        }
      });
    }
  });

  if (!clubFound) {
    console.log(`[MISS] ${player.name} - no stats table on Wikipedia`);
    return;
  }

  const clubs = [];
  for (let [club, stats] of clubMap.entries()) {
    clubs.push({ club, appearances: stats.appearances, goals: stats.goals });
  }
  
  const national = [];
  for (let [team, stats] of nationalMap.entries()) {
    national.push({ team, appearances: stats.appearances, goals: stats.goals });
  }

  const result = {
    apiId: player.apiId,
    name: player.name,
    clubs,
    national,
    careerTotal
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(result, null, 2));
  console.log(`[OK] ${player.name} (${clubs.length} clubs, ${national.length} national)`);
}

async function main() {
  console.log(`\n=== Scraping ${leagueArg.toUpperCase()} ===\n`);
  const files = await fs.readdir(PLAYERS_DIR);
  
  let totalPlayers = 0;
  let totalScraped = 0;
  let totalSkipped = 0;
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    console.log(`\n--- ${file.replace('.json', '').toUpperCase()} ---`);
    const data = JSON.parse(await fs.readFile(path.join(PLAYERS_DIR, file), 'utf8'));
    
    for (const player of data.players) {
      totalPlayers++;
      await scrapePlayer(player, file);
      // 3 second delay between players to avoid rate limits
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  // Final count
  const statsFiles = [];
  async function countFiles(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) await countFiles(path.join(dir, e.name));
        else if (e.name.endsWith('.json')) statsFiles.push(e.name);
      }
    } catch(e) {}
  }
  await countFiles(OUT_DIR);
  
  console.log(`\n=== ${leagueArg.toUpperCase()} COMPLETE ===`);
  console.log(`Total players in registry: ${totalPlayers}`);
  console.log(`Total stats files generated: ${statsFiles.length}`);
  console.log(`Missing: ${totalPlayers - statsFiles.length}`);
}

main().catch(console.error);
