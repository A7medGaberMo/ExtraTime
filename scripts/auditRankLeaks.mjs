import fs from 'fs';
import path from 'path';

// Load all rank question files
const dataDir = './data/rank';
const files = [];

function getFiles(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      getFiles(full);
    } else if (item.name.endsWith('.json')) {
      files.push(full);
    }
  }
}

getFiles(dataDir);

const leaks = [];

for (const file of files) {
  try {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    const questions = Array.isArray(content) ? content : [content];
    for (const q of questions) {
      if (!q.answers) continue;
      for (const a of q.answers) {
        const enName = a.name?.en || '';
        const arName = a.name?.ar || '';
        const subEn = a.subText?.en || '';
        const subAr = a.subText?.ar || '';
        const val = a.value;
        const valLabelEn = a.valueLabel?.en || '';

        // Check if value or stat appears in name or subText
        const strVal = String(val);
        const nameHasVal = (val !== undefined && strVal.length >= 2 && (enName.includes(strVal) || arName.includes(strVal)));
        const subHasVal = (val !== undefined && strVal.length >= 2 && (subEn.includes(strVal) || subAr.includes(strVal)));
        
        // Also check if words like "goals", "titles", "assists", "pts", "points", "caps" appear in name or subText
        const statWords = ['goal', 'goals', 'title', 'titles', 'assist', 'assists', 'point', 'points', 'pts', 'trophy', 'trophies', 'clean sheet', 'هدف', 'أهداف', 'لقب', 'ألقاب', 'تمريرة', 'تمريرات', 'نقطة', 'نقاط', 'بطولة', 'بطولات', 'شباك نظيفة'];
        const nameHasStatWord = statWords.some(w => enName.toLowerCase().includes(w) || arName.toLowerCase().includes(w));
        const subHasStatWord = statWords.some(w => subEn.toLowerCase().includes(w) || subAr.toLowerCase().includes(w));

        if (nameHasVal || subHasVal || nameHasStatWord || subHasStatWord) {
          leaks.push({
            file: path.relative('.', file),
            slug: q.slug,
            metric: q.metricLabel?.en,
            answerKey: a.answerKey,
            nameEn: enName,
            subEn,
            val,
            valLabelEn,
            reason: [
              nameHasVal ? 'name contains value' : '',
              subHasVal ? 'subText contains value' : '',
              nameHasStatWord ? 'name contains stat word' : '',
              subHasStatWord ? 'subText contains stat word' : ''
            ].filter(Boolean).join(', ')
          });
        }
      }
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
}

console.log(`Found ${leaks.length} potential leaks:\n`);
for (const leak of leaks) {
  console.log(`[${leak.file}] (${leak.slug})`);
  console.log(`  Name: "${leak.nameEn}" | Sub: "${leak.subEn}" | Value: ${leak.val} (${leak.valLabelEn})`);
  console.log(`  Reason: ${leak.reason}\n`);
}
