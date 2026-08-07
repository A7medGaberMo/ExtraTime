import * as cheerio from 'cheerio';

async function test() {
  const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/html/Bukayo_Saka');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  $('table.infobox tr').each((i, el) => {
    const text = $(el).text().replace(/\n/g, ' | ').trim();
    console.log(`Row ${i}: ${text}`);
  });
}

test();
