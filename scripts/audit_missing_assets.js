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

let missingClubLogos = [];
let missingPlayerImages = [];
let missingNations = [];
let missingPositions = [];
let missingTiers = [];

let totalPlayersChecked = 0;
let totalClubsChecked = 0;

allFiles.forEach(filePath => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (Array.isArray(data)) {
    // Legends file
    data.forEach(p => {
      totalPlayersChecked++;
      if (!p.imageUrl || p.imageUrl.trim() === '') missingPlayerImages.push(`[Legend] ${p.name}`);
      if (!p.nation || p.nation.trim() === '') missingNations.push(`[Legend] ${p.name}`);
      if (!p.position || p.position.trim() === '') missingPositions.push(`[Legend] ${p.name}`);
      if (!p.tier || p.tier.trim() === '') missingTiers.push(`[Legend] ${p.name}`);
    });
  } else if (data.club && data.players) {
    // Active Squad file
    totalClubsChecked++;
    const clubName = data.club.name || path.basename(filePath, '.json');

    if (!data.club.logo || data.club.logo.trim() === '') {
      missingClubLogos.push(`${clubName} (${filePath})`);
    }

    data.players.forEach(p => {
      totalPlayersChecked++;
      if (!p.imageUrl || p.imageUrl.trim() === '') missingPlayerImages.push(`[${clubName}] ${p.name}`);
      if (!p.nation || p.nation.trim() === '') missingNations.push(`[${clubName}] ${p.name}`);
      if (!p.position || p.position.trim() === '') missingPositions.push(`[${clubName}] ${p.name}`);
      if (!p.tier || p.tier.trim() === '') missingTiers.push(`[${clubName}] ${p.name}`);
    });
  }
});

console.log("=== ASSET AUDIT REPORT ===");
console.log(`Clubs checked: ${totalClubsChecked}`);
console.log(`Players checked: ${totalPlayersChecked}`);
console.log(`Missing Club Logos: ${missingClubLogos.length}`);
console.log(`Missing Player Images: ${missingPlayerImages.length}`);
console.log(`Missing Nations: ${missingNations.length}`);
console.log(`Missing Positions: ${missingPositions.length}`);
console.log(`Missing Tiers: ${missingTiers.length}`);

if (missingClubLogos.length > 0) {
  console.log("\nClubs missing logos:");
  missingClubLogos.forEach(c => console.log(`  - ${c}`));
}

if (missingPlayerImages.length > 0) {
  console.log(`\nSample players missing images (${missingPlayerImages.length} total):`);
  missingPlayerImages.slice(0, 15).forEach(p => console.log(`  - ${p}`));
}
