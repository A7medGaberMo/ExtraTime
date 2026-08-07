import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

const PLAYERS_DIR = path.join(process.cwd(), 'data', 'players', 'active', 'premier-league');
const OUT_DIR = path.join(process.cwd(), 'data', 'stats', 'active', 'premier-league');

async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 5000));
        continue;
      }
      return res;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
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
    const data = await res.json();
    if (data.query && data.query.search && data.query.search.length > 0) {
      return data.query.search[0].title;
    }
  } catch (e) {
    console.error(`Error searching for ${playerName}: ${e}`);
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
    console.log(`[SKIP] Already scraped ${player.name}`);
    return;
  } catch (e) {
    // File doesn't exist, proceed
  }

  const title = await getWikipediaPageTitle(player.name, player.club);
  if (!title) {
    console.log(`[SKIP] Wikipedia page not found for ${player.name}`);
    return;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
  const headers = { 'User-Agent': 'ExtraTimeBot/1.0 (contact@example.com)' };
  let html;
  try {
    const res = await fetchWithRetry(url, { headers });
    if (!res.ok) {
      console.log(`[SKIP] Failed to fetch HTML for ${title}`);
      return;
    }
    html = await res.text();
  } catch (e) {
    console.log(`[ERROR] Failed to fetch HTML for ${title}: ${e}`);
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
    
    // Check if it's a club stats table
    const isClubTable = text.includes('Appearances and goals by club, season and competition') || (text.includes('Club') && text.includes('Season'));
    // Check if it's a national team table
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
        // National tables often have just 3 or 4 columns (Team, Year, Apps, Goals)
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
    console.log(`[WARN] Club stats table not found for ${player.name}`);
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
  console.log(`[SUCCESS] Scraped ${player.name} (${clubs.length} clubs, ${national.length} national teams)`);
}

async function main() {
  const files = await fs.readdir(PLAYERS_DIR);
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    console.log(`\nProcessing club file: ${file}`);
    const data = JSON.parse(await fs.readFile(path.join(PLAYERS_DIR, file), 'utf8'));
    
    for (const player of data.players) {
      await scrapePlayer(player, file);
      // Delay to respect Wikipedia's 1 req/sec API limits (using 2000ms to be safe)
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

main().catch(console.error);
