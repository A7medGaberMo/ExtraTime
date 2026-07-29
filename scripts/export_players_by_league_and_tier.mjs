import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const activeDir = path.join(__dirname, '../data/players/active');
const outputDir = path.join(__dirname, '../data/leagues');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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

const dirToLeague = {
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'serie-a': 'Serie A',
  'bundesliga': 'Bundesliga',
  'ligue-1': 'Ligue 1'
};

const leagueSlugMap = {
  'Premier League': 'premier_league',
  'La Liga': 'la_liga',
  'Serie A': 'serie_a',
  'Bundesliga': 'bundesliga',
  'Ligue 1': 'ligue_1',
  'Saudi Pro League': 'saudi_pro_league',
  'Primeira Liga': 'primeira_liga',
  'Brasileirão': 'brasileirao',
  'Süper Lig': 'super_lig',
  'Eredivisie': 'eredivisie',
  'Belgian Pro League': 'belgian_pro_league',
  'MLS': 'mls'
};

const leaguesData = {};

const activeFiles = getAllFiles(activeDir);

activeFiles.forEach((filePath) => {
  const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const parentDir = path.basename(path.dirname(filePath));
  
  // Use directory override if top-level league folder, else file's league attribute
  const leagueName = dirToLeague[parentDir] || fileContent.club?.league || parentDir;
  const clubName = fileContent.club?.name || path.basename(filePath, '.json');

  if (!leaguesData[leagueName]) {
    leaguesData[leagueName] = [];
  }

  (fileContent.players || []).forEach((p) => {
    // Only active players (ignore if marked isLegend true)
    if (p.isLegend) return;

    leaguesData[leagueName].push({
      name: p.name,
      tier: p.tier || 'BRONZE',
      club: p.club || clubName
    });
  });
});

const tierOrder = ['MASTER', 'ELITE_PLUS', 'ELITE', 'GOLD', 'SILVER', 'BRONZE'];

const summaryFiles = [];

Object.keys(leaguesData).forEach((leagueName) => {
  const players = leaguesData[leagueName];
  const slug = leagueSlugMap[leagueName] || leagueName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `${slug}.md`;
  const filePath = path.join(outputDir, filename);

  // Group by tier
  const grouped = {};
  tierOrder.forEach(t => grouped[t] = []);
  players.forEach(p => {
    const t = p.tier || 'BRONZE';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(p);
  });

  let md = `# ${leagueName} - Active Players\n\n`;
  md += `**Total Players:** ${players.length}\n\n`;

  md += `## Tier Summary Breakdown\n\n`;
  md += `| Tier | Count |\n`;
  md += `| :--- | :---: |\n`;
  tierOrder.forEach(t => {
    md += `| **${t}** | ${grouped[t].length} |\n`;
  });
  md += `\n---\n\n`;

  tierOrder.forEach(t => {
    const list = grouped[t];
    if (list.length === 0) return;

    md += `## Tier: ${t} (${list.length} Players)\n\n`;
    md += `| # | Name | Tier | Club |\n`;
    md += `| --: | :--- | :---: | :--- |\n`;
    list.forEach((p, idx) => {
      md += `| ${idx + 1} | **${p.name}** | \`${p.tier}\` | ${p.club} |\n`;
    });
    md += `\n`;
  });

  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`Generated: ${filePath} (${players.length} players)`);
  summaryFiles.push({ leagueName, count: players.length, filename });
});

// Also create an index README in outputDir
let indexMd = `# Active Players Dataset by League & Tier\n\n`;
indexMd += `Summary of active player files generated for each league:\n\n`;
indexMd += `| League | File | Total Players |\n`;
indexMd += `| :--- | :--- | :---: |\n`;
summaryFiles.forEach(s => {
  indexMd += `| **${s.leagueName}** | [${s.filename}](./${s.filename}) | ${s.count} |\n`;
});

fs.writeFileSync(path.join(outputDir, 'README.md'), indexMd, 'utf8');
console.log(`Generated: ${path.join(outputDir, 'README.md')}`);
