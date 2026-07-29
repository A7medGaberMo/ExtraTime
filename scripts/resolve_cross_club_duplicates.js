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

// Build map of player occurrences
const playerOccurrences = {};

for (const filePath of jsonFiles) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!data.players || !Array.isArray(data.players)) continue;

  for (const p of data.players) {
    const key = p.name.trim().toLowerCase();
    if (!playerOccurrences[key]) {
      playerOccurrences[key] = [];
    }
    playerOccurrences[key].push({
      filePath,
      club: data.club.name,
      league: data.club.league,
      playerObj: p
    });
  }
}

// Find duplicates
let duplicatesCount = 0;
let resolvedCount = 0;

for (const [name, occurrences] of Object.entries(playerOccurrences)) {
  if (occurrences.length > 1) {
    duplicatesCount++;
    console.log(`\n🔍 Duplicate found for "${occurrences[0].playerObj.name}":`);
    for (const o of occurrences) {
      console.log(`   - Club: ${o.club} (${o.league})`);
    }

    // Resolution Logic:
    // If one is in "Global" (MLS, Saudi Pro League, Süper Lig, Primeira Liga, Brasileirão, Eredivisie, Belgian Pro League)
    // and the other is in top 5 leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1)
    // Keep the "Global" or the correct latest transfer club, and delete from the older/former club.
    
    // Let's define the correct active club for these specific duplicates:
    const correctClubs = {
      "victor osimhen": "Galatasaray",
      "ilkay gündogan": "Galatasaray",
      "ilkay gündoğan": "Galatasaray",
      "leroy sané": "Galatasaray",
      "marco asensio": "Fenerbahçe",
      "ederson": "Fenerbahçe", // Note: keeper Ederson Moraes went to Fenerbahce, don't confuse with Man City keeper if separate
      "milan Škriniar": "Fenerbahçe",
      "milan Škriniar": "Fenerbahçe",
      "milan skriniar": "Fenerbahçe",
      "n'golo kanté": "Fenerbahçe",
      "samuel lino": "Flamengo",
      "andreas pereira": "Palmeiras",
      "felipe anderson": "Palmeiras",
      "darwin núñez": "Al-Hilal",
      "theo hernández": "Al-Hilal",
      "joão cancelo": "Al-Hilal",
      "kalidou koulibaly": "Al-Hilal",
      "ivan toney": "Al-Ahli",
      "riyad mahrez": "Al-Ahli",
      "franck kessié": "Al-Ahli",
      "wenderson galeno": "Al-Ahli",
      "édouard mendy": "Al-Ahli",
      "enzo millot": "Al-Ahli",
      "moussa diaby": "Al-Ittihad",
      "andreas skov olsen": "Club Brugge"
    };

    const targetClub = correctClubs[name];
    if (targetClub) {
      // Clean up the files
      for (const o of occurrences) {
        if (o.club !== targetClub) {
          // Remove from this file
          const fileData = JSON.parse(fs.readFileSync(o.filePath, 'utf-8'));
          fileData.players = fileData.players.filter(p => p.name.trim().toLowerCase() !== name);
          fs.writeFileSync(o.filePath, JSON.stringify(fileData, null, 2));
          console.log(`   ❌ Removed from former club: ${o.club}`);
          resolvedCount++;
        } else {
          console.log(`   ✅ Retained in current club: ${o.club}`);
        }
      }
    } else {
      // Default: Keep the one with the higher kit number or first occurrence for safety, but notify
      console.log(`   ⚠️ No explicit override for "${name}". Please check manually.`);
    }
  }
}

console.log(`\n🎉 Duplicates audit finished.`);
console.log(`   🔍 Total duplicates found: ${duplicatesCount}`);
console.log(`   ✨ Total duplicate instances cleaned: ${resolvedCount}`);
