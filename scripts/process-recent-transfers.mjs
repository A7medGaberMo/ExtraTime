import fs from 'fs';
import path from 'path';

const transfers = JSON.parse(fs.readFileSync('scratch/recent_transfers_2026.json', 'utf-8'));
console.log(`Total 2025-2026 transfer events recorded: ${transfers.length}`);

// Load all active players
const root = 'data/players/active';
function getJsonFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(getJsonFiles(fullPath));
    else if (file.endsWith('.json')) results.push(fullPath);
  });
  return results;
}

const playerFiles = getJsonFiles(root);
const playerMap = new Map();

for (const file of playerFiles) {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const p of data.players || []) {
    playerMap.set(p.apiId, { file, player: p, club: data.club.name });
  }
}

console.log(`Loaded ${playerMap.size} unique active players in database.`);

const matchedTransfers = [];
for (const t of transfers) {
  if (playerMap.has(t.playerId)) {
    matchedTransfers.push({
      ...t,
      currentFileClub: playerMap.get(t.playerId).club,
      currentFile: playerMap.get(t.playerId).file
    });
  }
}

console.log(`Matched transfers for players in our database: ${matchedTransfers.length}`);
fs.writeFileSync('scratch/matched_transfers_2026.json', JSON.stringify(matchedTransfers, null, 2));

// Print unique players who had major 2025/2026 permanent or free agent transfers
const byPlayer = new Map();
for (const mt of matchedTransfers) {
  if (!byPlayer.has(mt.playerId)) byPlayer.set(mt.playerId, []);
  byPlayer.get(mt.playerId).push(mt);
}

console.log(`\nUnique players with recent transfer activity: ${byPlayer.size}`);
for (const [id, list] of byPlayer.entries()) {
  const latest = list[list.length - 1];
  console.log(`- [${id}] ${latest.playerName} | In DB as: ${latest.currentFileClub} | Latest Transfer: ${latest.from} -> ${latest.to} (${latest.date}, ${latest.type})`);
}
