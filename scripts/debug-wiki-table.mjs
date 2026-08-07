import * as cheerio from 'cheerio';

async function test() {
  const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/html/Bukayo_Saka');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let clubMap = new Map();
  let careerTotal = { appearances: 0, goals: 0 };
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
        if (firstCell === 'Club' || firstCell === 'Division' || firstCell.includes('season')) return;

        let isSeasonFirst = /^\d{4}/.test(firstCell);
        
        if (!isSeasonFirst) {
          currentClub = firstCell;
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
  });

  console.log("Clubs:");
  for (let [club, stats] of clubMap.entries()) {
    console.log(`- ${club}: ${stats.appearances} apps, ${stats.goals} goals`);
  }
  console.log(`Career Total: ${careerTotal.appearances} apps, ${careerTotal.goals} goals`);
}

test();
