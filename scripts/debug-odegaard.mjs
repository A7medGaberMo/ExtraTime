import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

async function test() {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/Martin_%C3%98degaard`;
  const headers = { 'User-Agent': 'ExtraTimeBot/1.0 (test@example.com)' };
  let html;
  try {
    const res = await fetch(url, { headers });
    html = await res.text();
  } catch (e) {
    return;
  }

  const $ = cheerio.load(html);
  
  let clubMap = new Map();
  let currentClub = null;
  let found = false;

  $('table.wikitable').each((i, table) => {
    if (found) return;
    const text = $(table).text();
    if (text.includes('Appearances and goals by club, season and competition') || (text.includes('Club') && text.includes('Season'))) {
      found = true;
      $(table).find('tr').each((j, tr) => {
        let cells = $(tr).find('th, td').map((k, el) => $(el).text().trim().replace(/\[.*?\]/g, '').replace(/,/g, '')).get();
        if (cells.length < 5) return;

        let firstCell = cells[0];
        
        if (firstCell.toLowerCase().includes('total')) return;
        if (firstCell === 'Club' || firstCell === 'Division' || firstCell.toLowerCase().includes('season')) return;

        let isSeasonFirst = /^\d{4}/.test(firstCell);
        
        if (!isSeasonFirst) {
          // Stripping (loan) correctly!
          currentClub = firstCell.replace(/\s*\(loan\)\s*/i, '');
        }

        if (currentClub) {
          let apps = parseInt(cells[cells.length - 2]) || 0;
          let goals = parseInt(cells[cells.length - 1]) || 0;
          
          if (!clubMap.has(currentClub)) {
            clubMap.set(currentClub, { appearances: 0, goals: 0 });
          }
          let stats = clubMap.get(currentClub);
          stats.appearances += apps;
          stats.goals += goals;
        }
      });
    }
  });

  for (let [club, stats] of clubMap.entries()) {
    console.log(`${club}: ${stats.appearances} | ${stats.goals}`);
  }
}

test();
