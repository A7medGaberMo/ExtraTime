import { chromium } from 'playwright';
import * as path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\A7med\\.gemini\\antigravity\\brain\\76adfd06-c7da-4558-9f1a-e258d503d14d';
const BASE_URL = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Create Room - Snipe (EN)
  await page.goto(`${BASE_URL}/create-room?mode=snipe`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'create-room-snipe-en.png') });

  const snipeMetrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    noScroll: document.documentElement.scrollHeight <= window.innerHeight,
  }));
  console.log('Create Room Snipe (EN):', snipeMetrics);

  // 2. Create Room - Draft (EN)
  await page.click('#tab-draft');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'create-room-draft-en.png') });

  // 3. Create Room - Rank (EN)
  await page.click('#tab-rank');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'create-room-rank-en.png') });

  // 4. Create Room - Bank (EN)
  await page.click('#tab-bank');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'create-room-bank-en.png') });

  // 5. Join Room (EN)
  await page.goto(`${BASE_URL}/join-room`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'join-room-empty-en.png') });

  // Enter a 6-character code to simulate PIN entry
  await page.keyboard.type('SNIP99');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'join-room-typed-en.png') });

  const joinMetrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
    noScroll: document.documentElement.scrollHeight <= window.innerHeight,
  }));
  console.log('Join Room (EN):', joinMetrics);

  // Arabic View (390x844)
  await page.goto(`${BASE_URL}/create-room?mode=snipe`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.setItem('NEXT_LOCALE', 'ar');
    document.cookie = 'NEXT_LOCALE=ar; path=/';
    window.location.reload();
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'create-room-snipe-ar.png') });

  await browser.close();
  console.log('Screenshots captured successfully!');
}

main().catch(console.error);
