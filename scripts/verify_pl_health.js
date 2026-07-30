const fs = require('fs');
const path = require('path');

function getAllJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'README.md') {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const dataDir = path.join(__dirname, '..', 'data', 'players');
const allFiles = getAllJsonFiles(dataDir);

let intraKitDupes = 0;
let crossClubDupes = 0;
const globalPlayerMap = new Map();

allFiles.forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!data.club || !data.players) return;

  const clubName = data.club.name;
  const usedKitNumbers = new Set();

  data.players.forEach(p => {
    // Check kit number dupe in club
    if (p.kitNumber !== undefined && p.kitNumber !== null) {
      if (usedKitNumbers.has(p.kitNumber)) {
        console.log(`[DUPLICATE KIT NUMBER] in ${clubName}: ${p.name} #${p.kitNumber}`);
        intraKitDupes++;
      } else {
        usedKitNumbers.add(p.kitNumber);
      }
    }

    // Check cross-club player dupe
    const key = p.apiId ? `apiId:${p.apiId}` : `name:${p.name.toLowerCase().trim()}`;
    if (globalPlayerMap.has(key)) {
      const existing = globalPlayerMap.get(key);
      if (existing.club !== clubName) {
        console.log(`[CROSS-CLUB DUPLICATE] ${p.name} (apiId: ${p.apiId}): [${existing.club}] vs [${clubName}]`);
        crossClubDupes++;
      }
    } else {
      globalPlayerMap.set(key, { name: p.name, club: clubName });
    }
  });
});

console.log("=== PREMIER LEAGUE & GLOBAL AUDIT ===");
console.log(`Intra-club Kit Number Duplicates: ${intraKitDupes}`);
console.log(`Cross-Club Player Duplicates: ${crossClubDupes}`);
