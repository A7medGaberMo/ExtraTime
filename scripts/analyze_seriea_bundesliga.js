const fs = require('fs');
const path = require('path');

function analyzeLeague(leagueName) {
  const dir = path.join(__dirname, '..', 'data', 'players', 'active', leagueName);
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  let total = 0;
  const defaultCount = {};

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    total += data.players.length;

    data.players.forEach(p => {
      defaultCount[p.nation] = (defaultCount[p.nation] || 0) + 1;
    });
  });

  console.log(`\n=== ${leagueName.toUpperCase()} (${files.length} teams, ${total} players) ===`);
  console.log("Top Nations:", Object.entries(defaultCount).sort((a,b) => b[1] - a[1]).slice(0, 10));
}

analyzeLeague('serie-a');
analyzeLeague('bundesliga');
