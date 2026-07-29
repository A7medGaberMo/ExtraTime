const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'la-liga');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.players.forEach(p => {
    if (p.kitNumber === undefined || p.kitNumber === null || p.kitNumber === "") {
      console.log(`Missing kitNumber in [${data.club.name}]: ${p.name} (apiId: ${p.apiId})`);
    }
  });
});
