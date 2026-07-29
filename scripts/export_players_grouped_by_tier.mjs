import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../data/players');
const activeDir = path.join(baseDir, 'active');
const legendsPath = path.join(baseDir, 'legends/legends.json');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.json')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allPlayers = [];

// Load legends
if (fs.existsSync(legendsPath)) {
  const legends = JSON.parse(fs.readFileSync(legendsPath, 'utf8'));
  legends.forEach(p => {
    allPlayers.push({
      name: p.name,
      position: p.position || 'CM',
      club: p.club || 'Legend Club',
      nation: p.nation || 'Unknown',
      league: 'Legends',
      tier: 'ICON',
      isLegend: true,
      apiId: p.apiId ? String(p.apiId) : undefined,
      imageUrl: p.imageUrl,
      kitNumber: p.kitNumber
    });
  });
}

// Load active players
const activeFiles = getAllFiles(activeDir);
activeFiles.forEach(filePath => {
  const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const clubName = fileContent.club?.name || 'Unknown Club';
  const leagueName = fileContent.club?.league || path.basename(path.dirname(filePath));

  (fileContent.players || []).forEach(p => {
    allPlayers.push({
      name: p.name,
      position: p.position || 'CM',
      club: p.club || clubName,
      nation: p.nation || 'Unknown',
      league: leagueName,
      tier: p.tier || 'BRONZE',
      isLegend: !!p.isLegend,
      apiId: p.apiId ? String(p.apiId) : undefined,
      imageUrl: p.imageUrl,
      kitNumber: p.kitNumber
    });
  });
});

console.log(`Total players collected: ${allPlayers.length}`);

// Group by tier
const groupedByTier = {
  ICON: [],
  MASTER: [],
  ELITE_PLUS: [],
  ELITE: [],
  GOLD: [],
  SILVER: [],
  BRONZE: []
};

allPlayers.forEach(p => {
  const tier = p.tier || 'BRONZE';
  if (!groupedByTier[tier]) {
    groupedByTier[tier] = [];
  }
  groupedByTier[tier].push(p);
});

// Write JSON file
const jsonPath = path.join(__dirname, '../data/players_grouped_by_tier.json');
fs.writeFileSync(jsonPath, JSON.stringify(groupedByTier, null, 2), 'utf8');
console.log(`Saved JSON export to: ${jsonPath}`);

// Build Markdown output
let mdContent = `# ExtraTime Player Dataset - Grouped by Tier\n\n`;
mdContent += `**Total Players:** ${allPlayers.length}\n\n`;
mdContent += `## Tier Summary Breakdown\n\n`;
mdContent += `| Tier | Count | Description |\n`;
mdContent += `| :--- | :---: | :--- |\n`;
mdContent += `| **ICON** | ${groupedByTier.ICON.length} | Legendary all-time football icons |\n`;
mdContent += `| **MASTER** | ${groupedByTier.MASTER.length} | World-class global superstars |\n`;
mdContent += `| **ELITE_PLUS** | ${groupedByTier.ELITE_PLUS.length} | Premier elite world talents |\n`;
mdContent += `| **ELITE** | ${groupedByTier.ELITE.length} | Top-tier professional stars |\n`;
mdContent += `| **GOLD** | ${groupedByTier.GOLD.length} | Established first-team starters |\n`;
mdContent += `| **SILVER** | ${groupedByTier.SILVER.length} | Key squad & rotation players |\n`;
mdContent += `| **BRONZE** | ${groupedByTier.BRONZE.length} | Emerging prospects & squad depth |\n\n`;

const tierOrder = ['ICON', 'MASTER', 'ELITE_PLUS', 'ELITE', 'GOLD', 'SILVER', 'BRONZE'];

tierOrder.forEach(tier => {
  const players = groupedByTier[tier];
  mdContent += `\n---\n\n## Tier: ${tier} (${players.length} Players)\n\n`;
  mdContent += `| # | Name | Position | Club | Nation | League |\n`;
  mdContent += `| --: | :--- | :---: | :--- | :--- | :--- |\n`;

  players.forEach((p, idx) => {
    mdContent += `| ${idx + 1} | **${p.name}** | \`${p.position}\` | ${p.club} | ${p.nation} | ${p.league} |\n`;
  });
});

const mdPath = path.join(__dirname, '../data/players_grouped_by_tier.md');
fs.writeFileSync(mdPath, mdContent, 'utf8');
console.log(`Saved Markdown export to: ${mdPath}`);
