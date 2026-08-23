import fs from 'fs';
import path from 'path';

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

getFiles('./data/rank');

let totalCleaned = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let questions = JSON.parse(content);
  let modified = false;

  for (const q of questions) {
    if (!q.answers) continue;
    for (const a of q.answers) {
      if (a.subText) {
        let en = a.subText.en || '';
        let ar = a.subText.ar || '';

        const originalEn = en;
        const originalAr = ar;

        // Strip any direct stat strings like "483 Goals", "11 Red Cards", "12 Titles"
        en = en.replace(/^\d+\s*(Goals|Red Cards|Yellow Cards|Titles|Trophies|Matches|Assists|Clean Sheets|Points|Caps|Wins).*$/gi, '');
        ar = ar.replace(/^\d+\s*(أهداف|أهدافًا|هدف|هدفًا|بطاقات حمراء|بطاقات صفراء|ألقاب|بطولات|مباريات|مباراة|تمريرات|تمريرة|شباك نظيفة|نقاط|نقطة|مشاركات|مشاركة|انتصارات).*$/gi, '');

        // Strip parenthetical stats inside subText
        en = en.replace(/\s*\(\d+\s*(Goals|Red Cards|Titles|Trophies|Matches|Assists|Clean Sheets|Points|Caps|Wins)[^\)]*\)/gi, '');
        ar = ar.replace(/\s*\(\d+\s*(أهداف|أهدافًا|هدف|هدفًا|بطاقات حمراء|ألقاب|بطولات|مباريات|مباراة|تمريرات|شباك نظيفة|نقاط|انتصارات)[^\)]*\)/gi, '');

        en = en.replace(/Record \d+ assists/gi, '');
        en = en.replace(/رقم قياسي \d+ تمريرة/gi, '');
        en = en.replace(/\s*\(Four goals in first half vs Brighton\)/gi, '');
        en = en.replace(/\s*\(أربعة أهداف في الشوط الأول ضد برايتون\)/gi, '');
        en = en.replace(/\s*\(Title Winning Season\)/gi, '');
        en = en.replace(/\s*\(موسم التتويج باللقب\)/gi, '');
        en = en.replace(/\s*\(100 Points League\)/gi, ' (Centurions)');
        en = en.replace(/\s*\(دوري الـ 100 نقطة\)/gi, ' (موسم المئوية)');
        en = en.replace(/\s*\(14th Title\)/gi, '');
        en = en.replace(/\s*\(اللقب الرابع عشر\)/gi, '');

        en = en.trim().replace(/\s{2,}/g, ' ');
        ar = ar.trim().replace(/\s{2,}/g, ' ');

        if (en !== originalEn || ar !== originalAr) {
          a.subText.en = en;
          a.subText.ar = ar;
          modified = true;
          totalCleaned++;
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(file, JSON.stringify(questions, null, 2) + '\n', 'utf8');
    console.log(`Cleaned: ${file}`);
  }
}

console.log(`Cleaned ${totalCleaned} additional spoiler fields.`);
