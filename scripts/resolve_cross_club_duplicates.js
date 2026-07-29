const fs = require('fs');
const path = require('path');

// Specific cross-club deduplication removals:
// [playerApiId]: file to remove from
const REMOVALS = [
  { apiId: 18814, removeFromFile: 'data/players/active/premier-league/ipswich.json', name: 'I. Diop' },
  { apiId: 303467, removeFromFile: 'data/players/active/premier-league/ipswich.json', name: 'A. Fatawu' },
  { apiId: 195103, removeFromFile: 'data/players/active/premier-league/aston-villa.json', name: 'João Gomes' }
];

let totalRemoved = 0;

REMOVALS.forEach(rem => {
  const filePath = path.join(__dirname, '..', rem.removeFromFile);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const initialLen = data.players.length;
    data.players = data.players.filter(p => String(p.apiId) !== String(rem.apiId));
    if (data.players.length < initialLen) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Removed duplicate ${rem.name} (apiId: ${rem.apiId}) from ${rem.removeFromFile}`);
      totalRemoved++;
    }
  }
});

console.log(`\n🎉 Cross-club deduplication complete! Total duplicates removed: ${totalRemoved}`);
