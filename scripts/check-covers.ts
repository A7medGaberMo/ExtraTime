import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface Viewport {
  width: number;
  height: number;
}

interface BoundingBox {
  top: number;
  height: number;
  left: number;
  width: number;
}

interface CoverMetrics {
  game: string;
  lang: string;
  viewport: Viewport;
  scrollHeight: number;
  innerHeight: number;
  noScroll: boolean;
  rulesBottom: number;
  rulesBottomOk: boolean;
  rulesLastTextHitInside: boolean;
  visualFrameHeight: number;
  visualFrameHeightOk: boolean;
  pillOverlapsFrame: boolean;
  publicMatchHeight: number;
  row2Height: number;
  pillHeight: number;
  boxes: Record<string, BoundingBox | null>;
  screenshotBuffer?: Buffer;
}

const VIEWPORTS: Viewport[] = [
  { width: 360, height: 640 },
  { width: 360, height: 740 },
  { width: 390, height: 700 },
  { width: 390, height: 844 },
  { width: 412, height: 780 },
  { width: 430, height: 932 },
  { width: 627, height: 913 },
  { width: 1280, height: 720 },
];

const CONTACT_SHEET_VIEWPORTS: Viewport[] = [
  { width: 390, height: 844 },
  { width: 360, height: 640 },
  { width: 627, height: 913 },
];

const GAMES = ['snipe', 'draft', 'rank', 'bank'];
const LANGUAGES = ['en', 'ar'];
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const ARTIFACTS_DIR = 'C:\\Users\\A7med\\.gemini\\antigravity\\brain\\76adfd06-c7da-4558-9f1a-e258d503d14d';
const CONTACT_SHEET_OUTPUT_DIR = path.join(process.cwd(), 'public', 'contact-sheets');

async function measurePage(
  page: Page,
  game: string,
  lang: string,
  vp: Viewport,
  captureScreenshot: boolean,
): Promise<CoverMetrics> {
  const url = `${BASE_URL}/${game}?lang=${lang}`;
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript('window.__name = (f) => f;');

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('[data-hub-row-1]', { timeout: 10000 });
  await page.waitForTimeout(300);

  const evaluation = await page.evaluate(() => {
    const docEl = document.documentElement;
    const innerH = window.innerHeight;
    const scrollH = docEl.scrollHeight;

    // Rules strip check
    const rulesStrip = document.querySelector('[data-hub-rules-strip]');
    let rulesBottom = 0;
    let rulesBottomOk = true;
    let rulesLastTextHitInside = true;

    if (rulesStrip) {
      const rRect = rulesStrip.getBoundingClientRect();
      rulesBottom = rRect.bottom;
      rulesBottomOk = rRect.bottom <= innerH + 1.0;

      // Find center of last text line inside rules strip
      const allTextEls = rulesStrip.querySelectorAll('.hub-feature-subline, .hub-feature-title');
      const textEls: HTMLElement[] = [];
      for (let i = 0; i < allTextEls.length; i++) {
        const el = allTextEls[i] as HTMLElement;
        if (el.offsetParent !== null && (el.textContent || '').trim().length > 0) {
          textEls.push(el);
        }
      }

      const targetEl = textEls.length > 0 ? textEls[textEls.length - 1] : (rulesStrip as HTMLElement);
      const tRect = targetEl.getBoundingClientRect();
      const cx = tRect.left + tRect.width / 2;
      const cy = tRect.top + tRect.height / 2;

      const hit = document.elementFromPoint(cx, cy);
      rulesLastTextHitInside = hit !== null && (rulesStrip.contains(hit) || hit.contains(targetEl));
    }

    // Visual frame & pill check
    const frameEl = document.querySelector('[data-hub-visual-frame]');
    const pillEl = document.querySelector('[data-hub-queue-pill]');
    let frameHeight = 0;
    let pillOverlaps = false;

    if (frameEl && pillEl) {
      const fRect = frameEl.getBoundingClientRect();
      const pRect = pillEl.getBoundingClientRect();
      frameHeight = fRect.height;
      pillOverlaps = pRect.top < fRect.bottom - 0.5;
    }

    // Buttons & Pill
    const ctaBtn = document.querySelector('.hub-cta-btn');
    const r2Btn = document.querySelector('.hub-action-card');
    const pubMatchHeight = ctaBtn ? ctaBtn.getBoundingClientRect().height : 0;
    const row2BtnHeight = r2Btn ? r2Btn.getBoundingClientRect().height : 0;
    const pillHeight = pillEl ? pillEl.getBoundingClientRect().height : 0;

    // Element boxes
    const selectors: Record<string, string> = {
      header: 'header',
      eyebrow: '[data-hub-eyebrow]',
      title: '[data-hub-title]',
      subtitle: '[data-hub-subtitle]',
      visualFrame: '[data-hub-visual-frame]',
      visualCircle: '[data-hub-visual-circle]',
      queuePill: '[data-hub-queue-pill]',
      row1: '[data-hub-row-1]',
      row2: '[data-hub-row-2]',
      rulesStrip: '[data-hub-rules-strip]',
    };

    const boxes: Record<string, { top: number; height: number; left: number; width: number } | null> = {};
    const selectorKeys = Object.keys(selectors);
    for (let i = 0; i < selectorKeys.length; i++) {
      const k = selectorKeys[i];
      const el = document.querySelector(selectors[k]);
      if (!el) {
        boxes[k] = null;
      } else {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          boxes[k] = null;
        } else {
          boxes[k] = {
            top: Math.round(rect.top * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
            left: Math.round(rect.left * 100) / 100,
            width: Math.round(rect.width * 100) / 100,
          };
        }
      }
    }

    return {
      scrollHeight: scrollH,
      innerHeight: innerH,
      noScroll: scrollH <= innerH,
      rulesBottom,
      rulesBottomOk,
      rulesLastTextHitInside,
      visualFrameHeight: frameHeight,
      visualFrameHeightOk: frameHeight >= 139.5 && frameHeight <= 240.5,
      pillOverlapsFrame: pillOverlaps,
      publicMatchHeight: pubMatchHeight,
      row2Height: row2BtnHeight,
      pillHeight,
      boxes,
    };
  });

  let screenshotBuffer: Buffer | undefined;
  if (captureScreenshot) {
    screenshotBuffer = await page.screenshot({ fullPage: false });
  }

  return {
    game,
    lang,
    viewport: vp,
    ...evaluation,
    screenshotBuffer,
  };
}

async function generateContactSheet(
  browser: Browser,
  vp: Viewport,
  lang: string,
  metricsList: CoverMetrics[],
) {
  fs.mkdirSync(CONTACT_SHEET_OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const sheetPage = await browser.newPage();
  const gap = 16;
  const padding = 20;
  const headerHeight = 44;
  const totalWidth = vp.width * 4 + gap * 3 + padding * 2;
  const totalHeight = vp.height + headerHeight + padding * 2;

  await sheetPage.setViewportSize({ width: totalWidth, height: totalHeight });

  const coversHtml = metricsList
    .map((m) => {
      const base64 = m.screenshotBuffer?.toString('base64');
      const gameLabel = m.game.toUpperCase();
      return `
        <div style="display: flex; flex-direction: column; align-items: center; width: ${vp.width}px;">
          <div style="height: ${headerHeight}px; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #E5B842;">
            ${gameLabel} (${lang.toUpperCase()})
          </div>
          <img src="data:image/png;base64,${base64}" style="width: ${vp.width}px; height: ${vp.height}px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 8px 32px rgba(0,0,0,0.6);" />
        </div>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="utf-8" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          body { background: #030407; padding: ${padding}px; display: flex; flex-direction: row; gap: ${gap}px; align-items: flex-start; justify-content: center; }
        </style>
      </head>
      <body>
        ${coversHtml}
      </body>
    </html>
  `;

  await sheetPage.setContent(html);
  await sheetPage.waitForTimeout(300);

  const filename = `contact-sheet-${vp.width}x${vp.height}-${lang}.png`;
  const localPath = path.join(CONTACT_SHEET_OUTPUT_DIR, filename);
  const artifactPath = path.join(ARTIFACTS_DIR, filename);

  const buffer = await sheetPage.screenshot({ fullPage: true });
  fs.writeFileSync(localPath, buffer);
  fs.writeFileSync(artifactPath, buffer);

  await sheetPage.close();
  console.log(`Saved contact sheet: ${filename}`);
}

async function run() {
  console.log('🚀 Starting Cover Consistency & Layout Bounding Verification...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let allPassed = true;
  const failureReasons: string[] = [];

  for (const vp of VIEWPORTS) {
    const isContactSheetVp = CONTACT_SHEET_VIEWPORTS.some(
      (c) => c.width === vp.width && c.height === vp.height,
    );

    for (const lang of LANGUAGES) {
      console.log(`\n═══════════════════════════════════════════════════════════════════════`);
      console.log(`VIEWPORT: ${vp.width}x${vp.height} | LANGUAGE: ${lang.toUpperCase()}`);
      console.log(`═══════════════════════════════════════════════════════════════════════`);

      const metricsList: CoverMetrics[] = [];

      for (const game of GAMES) {
        const metrics = await measurePage(page, game, lang, vp, isContactSheetVp);
        metricsList.push(metrics);
      }

      // Check 1: No scroll
      for (const m of metricsList) {
        if (!m.noScroll) {
          const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] scrollHeight (${m.scrollHeight}) > innerHeight (${m.innerHeight})`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
      }

      // Check 2: Rules strip bottom edge & text visible
      for (const m of metricsList) {
        if (!m.rulesBottomOk) {
          const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] rules strip bottom (${m.rulesBottom}) > innerHeight (${m.innerHeight})`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
        if (!m.rulesLastTextHitInside) {
          const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] rules strip last text line is clipped or covered`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
      }

      // Check 3: Visual frame between 140px and 240px & queue pill no overlap
      for (const m of metricsList) {
        if (!m.visualFrameHeightOk) {
          const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] visual frame height (${m.visualFrameHeight}px) not in range [140px, 240px]`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
        if (m.pillOverlapsFrame) {
          const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] queue pill overlaps visual frame`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
      }

      // Check 4: When no shrink step is active (height > 665px)
      if (vp.height > 665) {
        for (const m of metricsList) {
          if (Math.abs(m.publicMatchHeight - 68) > 1.5) {
            const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] Public Match height is ${m.publicMatchHeight}px (expected 68px)`;
            failureReasons.push(msg);
            console.error(`❌ ${msg}`);
            allPassed = false;
          }
          if (Math.abs(m.row2Height - 72) > 1.5) {
            const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] Row 2 buttons height is ${m.row2Height}px (expected 72px)`;
            failureReasons.push(msg);
            console.error(`❌ ${msg}`);
            allPassed = false;
          }
          if (Math.abs(m.pillHeight - 44) > 1.5) {
            const msg = `FAIL: [${m.game} | ${vp.width}x${vp.height} | ${lang}] Queue pill height is ${m.pillHeight}px (expected 44px)`;
            failureReasons.push(msg);
            console.error(`❌ ${msg}`);
            allPassed = false;
          }
        }
      }

      // Check 5: Bounding Box Consistency across covers (diff <= 1px)
      const elementKeys = [
        'header',
        'eyebrow',
        'title',
        'subtitle',
        'visualFrame',
        'visualCircle',
        'queuePill',
        'row1',
        'row2',
        'rulesStrip',
      ];

      console.log('\n--- Component Bounding Box Comparisons (Top, Height, Left, Width) ---');
      console.log(
        `Component`.padEnd(14) +
          `| Snipe (T,H,L,W)`.padEnd(25) +
          `| Draft (T,H,L,W)`.padEnd(25) +
          `| Rank (T,H,L,W)`.padEnd(25) +
          `| Bank (T,H,L,W)`.padEnd(25) +
          `| Max Δ`,
      );
      console.log('-'.repeat(125));

      for (const elKey of elementKeys) {
        const boxes = metricsList.map((m) => m.boxes[elKey]);
        const allPresent = boxes.every((b) => b !== null);
        const allNull = boxes.every((b) => b === null);

        if (allNull) {
          console.log(`${elKey.padEnd(14)}| [HIDDEN IN ALL GAMES BY SHRINK STEP]`);
          continue;
        }

        if (!allPresent && !allNull) {
          const msg = `FAIL: [${vp.width}x${vp.height} | ${lang}] ${elKey} presence mismatch across games`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
          continue;
        }

        const tops = boxes.map((b) => b!.top);
        const heights = boxes.map((b) => b!.height);
        const lefts = boxes.map((b) => b!.left);
        const widths = boxes.map((b) => b!.width);

        const deltaTop = Math.max(...tops) - Math.min(...tops);
        const deltaHeight = Math.max(...heights) - Math.min(...heights);
        const deltaLeft = Math.max(...lefts) - Math.min(...lefts);
        const deltaWidth = Math.max(...widths) - Math.min(...widths);

        const maxDelta = Math.max(deltaTop, deltaHeight, deltaLeft, deltaWidth);

        const fmtBox = (b: BoundingBox | null) =>
          b ? `${b.top}, ${b.height}, ${b.left}, ${b.width}` : 'null';

        const rowStr =
          `${elKey.padEnd(14)}` +
          `| ${fmtBox(boxes[0]).padEnd(23)}` +
          `| ${fmtBox(boxes[1]).padEnd(23)}` +
          `| ${fmtBox(boxes[2]).padEnd(23)}` +
          `| ${fmtBox(boxes[3]).padEnd(23)}` +
          `| ${maxDelta.toFixed(1)}px`;

        console.log(rowStr);

        if (maxDelta > 1.0) {
          const msg = `FAIL: [${vp.width}x${vp.height} | ${lang}] ${elKey} differs by ${maxDelta.toFixed(1)}px (> 1px) across games (ΔTop: ${deltaTop.toFixed(1)}, ΔHeight: ${deltaHeight.toFixed(1)}, ΔLeft: ${deltaLeft.toFixed(1)}, ΔWidth: ${deltaWidth.toFixed(1)})`;
          failureReasons.push(msg);
          console.error(`❌ ${msg}`);
          allPassed = false;
        }
      }

      // Generate contact sheet if this is one of the contact sheet viewports
      if (isContactSheetVp) {
        await generateContactSheet(browser, vp, lang, metricsList);
      }
    }
  }

  await browser.close();

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('🎉 ALL COVER CONSISTENCY & GEOMETRY CHECKS PASSED PERFECTLY (0 ERRORS)!');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.error(`❌ VERIFICATION FAILED WITH ${failureReasons.length} ISSUES:`);
    failureReasons.forEach((r, idx) => console.error(`  ${idx + 1}. ${r}`));
    console.error('═══════════════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
