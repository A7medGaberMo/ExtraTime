import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(__dirname, '..', 'data', 'players');

function readAllPlayerFiles(dir) {
  const players = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      players.push(...readAllPlayerFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      const clubData = data.club || {};
      const league = clubData.league || 'Global';
      for (const p of data.players || []) {
        players.push({
          name: p.name,
          position: p.position,
          club: p.club || clubData.name,
          nation: p.nation,
          league,
          tier: p.tier,
          isLegend: p.isLegend || false,
          apiId: String(p.apiId ?? ''),
          imageUrl: p.imageUrl,
          kitNumber: p.kitNumber,
        });
      }
    }
  }
  return players;
}

const allPlayers = readAllPlayerFiles(DATA_ROOT);
console.log(`Total players found: ${allPlayers.length}`);

// Write args to a temp file
const argsPath = path.join(__dirname, '_seed_args_temp.json');
fs.writeFileSync(argsPath, JSON.stringify({ players: allPlayers }));

// Run convex with args file piped in
const result = spawnSync('npx.cmd', [
  'convex', 'run', 
  '--dev',
  'seed/seedData:seedAllData',
  `--args-file=${argsPath}`,
], {
  cwd: path.join(__dirname, '..'),
  encoding: 'utf8',
  timeout: 120000,
  shell: true,
});

console.log('stdout:', result.stdout);
console.log('stderr:', result.stderr);

if (result.error) {
  console.error('Error:', result.error.message);
}

// Clean up
fs.unlinkSync(argsPath);
console.log('Temp file cleaned up.');
