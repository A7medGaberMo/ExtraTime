import fs from 'fs';
import path from 'path';

const filesWithCategory = [
  { file: 'data/rank/players/modern-superstars.json', category: 'players' },
  { file: 'data/rank/players/legends-and-icons.json', category: 'players' },
  { file: 'data/rank/players/transfer-market-records.json', category: 'transfers' },
  { file: 'data/rank/players/defenders-and-goalkeepers.json', category: 'players' },
  { file: 'data/rank/players/playmakers-and-creators.json', category: 'players' },
  { file: 'data/rank/clubs/club-records-and-dynasties.json', category: 'clubs' },
  { file: 'data/rank/competitions/world-cup-and-international.json', category: 'competitions' },
  { file: 'data/rank/seasons/legendary-campaigns.json', category: 'seasons' },
];

let totalConverted = 0;

for (const { file, category } of filesWithCategory) {
  const filePath = path.resolve(file);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  const converted = raw.map((q) => {
    // Sort answers strictly by correctRank (or value)
    const sortedAnswers = [...q.answers].sort((a, b) => {
      if (a.correctRank && b.correctRank) return a.correctRank - b.correctRank;
      if (q.direction === 'asc') return a.value - b.value;
      return b.value - a.value;
    });

    const cleanAnswers = sortedAnswers.map((a) => {
      const item = {
        answerKey: a.answerKey,
        name: a.name,
      };
      if (a.subText?.en && a.subText?.ar) {
        item.subText = a.subText;
      }
      item.media = a.media;
      item.stat = a.valueLabel || a.stat;
      return item;
    });

    const cleanQ = {
      title: q.title,
    };

    if (q.subtitle?.en && q.subtitle?.ar) {
      cleanQ.subtitle = q.subtitle;
    }

    cleanQ.category = category;
    cleanQ.answers = cleanAnswers;

    return cleanQ;
  });

  fs.writeFileSync(filePath, JSON.stringify(converted, null, 2), 'utf-8');
  console.log(`✅ Converted ${file} (${converted.length} questions)`);
  totalConverted += converted.length;
}

console.log(`\n🎉 Total Questions Successfully Migrated to Lean Format: ${totalConverted}`);
