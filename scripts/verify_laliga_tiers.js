const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'data', 'players', 'active', 'la-liga');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const tierCounts = {};
let emptyTiers = 0;
let missingKitNum = 0;
let missingNation = 0;
let missingPosition = 0;

files.forEach(file => {
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  data.players.forEach(p => {
    if (!p.tier) emptyTiers++;
    else tierCounts[p.tier] = (tierCounts[p.tier] || 0) + 1;

    if (p.kitNumber === undefined || p.kitNumber === null) missingKitNum++;
    if (!p.nation) missingNation++;
    if (!p.position) missingPosition++;
  });
});

console.log("=== LA LIGA AUDIT RESULTS ===");
console.log("Tier Distribution:", tierCounts);
console.log(`Empty Tiers: ${emptyTiers}`);
console.log(`Missing Kit Numbers: ${missingKitNum}`);
console.log(`Missing Nations: ${missingNation}`);
console.log(`Missing Positions: ${missingPosition}`);
