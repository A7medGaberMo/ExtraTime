import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.json')) {
      results.push(file);
    }
  });
  return results;
}

// 1. Collect all valid player images from data/players
const playerFiles = walk('data/players');
const playerNameToImage = new Map();

function clean(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

playerFiles.forEach((file) => {
  try {
    const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
    const list = Array.isArray(content) ? content : content.players || [];
    list.forEach((p) => {
      if (p.name && p.imageUrl) {
        playerNameToImage.set(clean(p.name), p.imageUrl);
        // Also register last name or aliases
        const parts = p.name.split(' ');
        if (parts.length > 1) {
          playerNameToImage.set(clean(parts[parts.length - 1]), p.imageUrl);
        }
      }
    });
  } catch (e) {}
});

console.log(`Indexed ${playerNameToImage.size} player entries from data/players.`);

// 2. Check rank questions
const rankFiles = walk('data/rank');
let totalAnswers = 0;
let updatedImages = 0;

rankFiles.forEach((file) => {
  const content = JSON.parse(fs.readFileSync(file, 'utf-8'));
  content.forEach((q) => {
    q.answers.forEach((a) => {
      totalAnswers++;
      const nameKey = clean(a.name.en);
      const foundImage = playerNameToImage.get(nameKey);
      if (foundImage) {
        updatedImages++;
      }
    });
  });
});

console.log(`Total answers in rank: ${totalAnswers}, Matched player images: ${updatedImages}`);
