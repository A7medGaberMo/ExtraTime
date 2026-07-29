const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'data', 'players', 'active');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith(".json")) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const jsonFiles = getAllFiles(baseDir);

// Mapping of player names to remove from specific former clubs
const cleanupTargets = [
  { name: "Osimhen", formerClub: "Napoli" },
  { name: "Gündoğan", formerClub: "Barcelona" },
  { name: "Gündogan", formerClub: "Barcelona" },
  { name: "Sané", formerClub: "Bayern" },
  { name: "Sane", formerClub: "Bayern" },
  { name: "Asensio", formerClub: "Paris" },
  { name: "Škriniar", formerClub: "Paris" },
  { name: "Skriniar", formerClub: "Paris" },
  { name: "Kanté", formerClub: "Chelsea" },
  { name: "Kante", formerClub: "Chelsea" },
  { name: "Lino", formerClub: "Atlético" },
  { name: "Lino", formerClub: "Atletico" },
  { name: "Pereira", formerClub: "Fulham" },
  { name: "Felipe Anderson", formerClub: "Lazio" },
  { name: "Núñez", formerClub: "Liverpool" },
  { name: "Nunez", formerClub: "Liverpool" },
  { name: "Hernández", formerClub: "Milan" },
  { name: "Hernandez", formerClub: "Milan" },
  { name: "Cancelo", formerClub: "Barcelona" },
  { name: "Cancelo", formerClub: "Manchester City" },
  { name: "Koulibaly", formerClub: "Chelsea" },
  { name: "Toney", formerClub: "Brentford" },
  { name: "Mahrez", formerClub: "Manchester City" },
  { name: "Kessié", formerClub: "Barcelona" },
  { name: "Kessie", formerClub: "Barcelona" },
  { name: "Galeno", formerClub: "Porto" },
  { name: "Mendy", formerClub: "Chelsea" },
  { name: "Millot", formerClub: "Stuttgart" },
  { name: "Diaby", formerClub: "Aston Villa" },
  { name: "Henderson", formerClub: "Liverpool" },
  { name: "Henderson", formerClub: "Al-Ettifaq" }
];

let removedCount = 0;

for (const filePath of jsonFiles) {
  let fileModified = false;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!data.players || !Array.isArray(data.players)) continue;

  const initialCount = data.players.length;

  data.players = data.players.filter(p => {
    // Check if this player matches any of the cleanup targets
    const shouldRemove = cleanupTargets.some(target => {
      const nameMatch = p.name.includes(target.name) || target.name.includes(p.name);
      const clubMatch = data.club.name.toLowerCase().includes(target.formerClub.toLowerCase());
      return nameMatch && clubMatch;
    });

    if (shouldRemove) {
      console.log(`❌ Removing duplicate/former player: ${p.name} from club: ${data.club.name}`);
      removedCount++;
      fileModified = true;
      return false;
    }
    return true;
  });

  if (fileModified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

console.log(`\n🎉 Cleanup complete. Total players removed: ${removedCount}`);
