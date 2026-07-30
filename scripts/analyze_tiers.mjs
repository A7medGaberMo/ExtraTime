import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const plDir = path.join(__dirname, '..', 'data', 'players', 'active', 'premier-league');
const files = fs.readdirSync(plDir);

files.forEach(file => {
  if (file === 'arsenal.json' || file === 'chelsea.json') return;
  const filePath = path.join(plDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n=== ${data.club.name} ===`);
  const playersByTier = {};
  data.players.forEach(p => {
    if (!playersByTier[p.tier]) playersByTier[p.tier] = [];
    playersByTier[p.tier].push(`${p.name} (${p.position})`);
  });
  
  ['MASTER', 'ELITE_PLUS', 'ELITE', 'GOLD', 'SILVER', 'BRONZE'].forEach(tier => {
    if (playersByTier[tier]) {
      console.log(`  ${tier}: ${playersByTier[tier].join(', ')}`);
    }
  });
});
