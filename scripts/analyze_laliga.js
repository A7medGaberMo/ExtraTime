const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'la-liga');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

let totalPlayers = 0;
const clubSummary = {};

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clubName = data.club.name;
  totalPlayers += data.players.length;
  clubSummary[clubName] = {
    file,
    count: data.players.length,
    players: data.players.map(p => ({
      apiId: p.apiId,
      name: p.name,
      position: p.position,
      nation: p.nation,
      tier: p.tier,
      kitNumber: p.kitNumber
    }))
  };
});

console.log(`Total La Liga files: ${files.length}, Total players: ${totalPlayers}`);
Object.keys(clubSummary).forEach(club => {
  console.log(`- ${club}: ${clubSummary[club].count} players`);
});
