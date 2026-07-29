const fs = require('fs');
const path = require('path');

function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'README.md' && file !== 'legends.json') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const activeDir = path.join(__dirname, '..', 'data', 'players', 'active');
const allFiles = getAllJsonFiles(activeDir);

const playerMap = new Map(); // key: apiId or normalized name
const duplicates = [];
const intraDuplicates = [];

let totalPlayersCount = 0;

allFiles.forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clubName = data.club?.name || path.basename(filePath, '.json');
  const seenInClub = new Set();

  data.players.forEach((player, index) => {
    totalPlayersCount++;
    const apiIdKey = player.apiId ? `apiId:${player.apiId}` : null;
    const nameKey = `name:${player.name.toLowerCase().trim()}`;
    const key = apiIdKey || nameKey;

    // Check intra-club duplicate
    if (seenInClub.has(key)) {
      intraDuplicates.push({ club: clubName, name: player.name, apiId: player.apiId, index, filePath });
    } else {
      seenInClub.add(key);
    }

    // Check cross-club duplicate
    if (playerMap.has(key)) {
      const existing = playerMap.get(key);
      if (existing.club !== clubName) {
        duplicates.push({
          key,
          name: player.name,
          apiId: player.apiId,
          clubA: existing.club,
          fileA: existing.filePath,
          indexA: existing.index,
          clubB: clubName,
          fileB: filePath,
          indexB: index
        });
      }
    } else {
      playerMap.set(key, { name: player.name, club: clubName, filePath, index });
    }
  });
});

console.log(`=== DUPLICATE AUDIT SUMMARY ===`);
console.log(`Total active players scanned: ${totalPlayersCount}`);
console.log(`Intra-club duplicates found: ${intraDuplicates.length}`);
console.log(`Cross-club duplicates found: ${duplicates.length}`);

if (intraDuplicates.length > 0) {
  console.log(`\nIntra-club duplicates:`);
  intraDuplicates.forEach(d => console.log(`  - [${d.club}] ${d.name} (apiId: ${d.apiId})`));
}

if (duplicates.length > 0) {
  console.log(`\nCross-club duplicates:`);
  duplicates.forEach(d => console.log(`  - ${d.name} (apiId: ${d.apiId}): [${d.clubA}] vs [${d.clubB}]`));
}
