import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Master ET Mark SVG Paths (Exact sharp vector angles for E & T integrated badge)
// ViewBox 0 0 400 300
function getLogoSvg({ variant = 'primary', size = 512, width = 400, height = 300 } = {}) {
  let defs = '';
  let fillE = '#FFFFFF';
  let fillT = 'url(#et-primary-grad)';
  let bg = 'none';
  let stroke = 'none';
  let filter = '';
  let opacity = '1.0';
  let showWordmark = true;

  if (variant === 'icon-only' || variant === 'micro-16px' || variant === 'card-badge' || variant === 'favicon') {
    showWordmark = false;
  }

  // Define Gradients and Filters according to requested style
  defs = `
    <defs>
      <!-- Primary Green Gradient -->
      <linearGradient id="et-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#34D399" />
        <stop offset="50%" stop-color="#10B981" />
        <stop offset="100%" stop-color="#059669" />
      </linearGradient>

      <!-- Lime Electric Gradient -->
      <linearGradient id="et-lime-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#B8F036" />
        <stop offset="50%" stop-color="#95E810" />
        <stop offset="100%" stop-color="#65B307" />
      </linearGradient>

      <!-- Metallic Silver Gradient -->
      <linearGradient id="et-silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="25%" stop-color="#E2E8F0" />
        <stop offset="50%" stop-color="#94A3B8" />
        <stop offset="75%" stop-color="#CBD5E1" />
        <stop offset="100%" stop-color="#64748B" />
      </linearGradient>

      <!-- Metallic Gold Gradient -->
      <linearGradient id="et-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF7CC" />
        <stop offset="30%" stop-color="#FDE68A" />
        <stop offset="60%" stop-color="#D4AF37" />
        <stop offset="85%" stop-color="#92400E" />
        <stop offset="100%" stop-color="#F59E0B" />
      </linearGradient>

      <!-- Brushed Steel Gradient -->
      <linearGradient id="et-steel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#94A3B8" />
        <stop offset="50%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0F172A" />
      </linearGradient>

      <!-- Holographic Foil Multi-color Spectrum -->
      <linearGradient id="et-holo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF7A8A" />
        <stop offset="25%" stop-color="#FDE68A" />
        <stop offset="50%" stop-color="#34D399" />
        <stop offset="75%" stop-color="#60A5FA" />
        <stop offset="100%" stop-color="#C084FC" />
      </linearGradient>

      <!-- Glass Gloss Gradient -->
      <linearGradient id="et-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.8)" />
        <stop offset="50%" stop-color="rgba(255,255,255,0.2)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
      </linearGradient>

      <!-- Emboss Bevel Drop Shadows -->
      <filter id="et-emboss" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feOffset in="blur" dx="-2" dy="-2" result="offset1" />
        <feComponentTransfer in="offset1" result="light">
          <feFuncA type="linear" slope="0.7" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="light" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  `;

  switch (variant) {
    case 'primary':
      fillE = '#FFFFFF';
      fillT = 'url(#et-lime-grad)';
      break;
    case 'monochrome-white':
      fillE = '#FFFFFF';
      fillT = '#FFFFFF';
      break;
    case 'monochrome-black':
      fillE = '#02050A';
      fillT = '#02050A';
      break;
    case 'metallic-silver':
      fillE = 'url(#et-silver-grad)';
      fillT = 'url(#et-silver-grad)';
      break;
    case 'metallic-gold':
      fillE = 'url(#et-gold-grad)';
      fillT = 'url(#et-gold-grad)';
      break;
    case 'brushed-steel':
      fillE = 'url(#et-steel-grad)';
      fillT = 'url(#et-steel-grad)';
      break;
    case 'embossed':
      fillE = '#E2E8F0';
      fillT = '#95E810';
      filter = 'url(#et-emboss)';
      break;
    case 'debossed':
      fillE = '#64748B';
      fillT = '#32521E';
      break;
    case 'glass':
      fillE = 'url(#et-glass-grad)';
      fillT = 'url(#et-glass-grad)';
      stroke = 'rgba(255,255,255,0.4)';
      break;
    case 'holographic-foil':
      fillE = 'url(#et-holo-grad)';
      fillT = 'url(#et-holo-grad)';
      break;
    case 'minimal-outline':
      fillE = 'none';
      fillT = 'none';
      stroke = '#95E810';
      break;
    case 'icon-only':
      fillE = '#FFFFFF';
      fillT = 'url(#et-lime-grad)';
      break;
    case 'watermark':
      fillE = '#FFFFFF';
      fillT = '#FFFFFF';
      opacity = '0.08';
      break;
    case 'micro-16px':
      fillE = '#FFFFFF';
      fillT = '#95E810';
      break;
    case 'card-badge':
      fillE = 'url(#et-silver-grad)';
      fillT = 'url(#et-gold-grad)';
      filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))';
      break;
    case 'favicon':
      fillE = '#FFFFFF';
      fillT = '#95E810';
      bg = '#02050A';
      break;
  }

  // Core Vector Monogram: E and T shapes (italic athletic forward slant)
  // Base coordinates centered nicely
  const strokeAttr = stroke !== 'none' ? `stroke="${stroke}" stroke-width="6"` : '';
  const filterAttr = filter ? `filter="${filter}"` : '';

  const viewBox = showWordmark ? '0 0 400 300' : '0 0 200 200';
  const transform = showWordmark ? 'translate(100, 35)' : 'translate(0, 0)';

  const eShape = `
    <!-- E Monogram Slash -->
    <path d="M 45 40 L 115 40 L 105 68 L 65 68 L 59 86 L 95 86 L 85 114 L 49 114 L 41 138 L 85 138 L 75 166 L 5 166 Z" fill="${fillE}" ${strokeAttr} />
  `;

  const tShape = `
    <!-- T Monogram Slash -->
    <path d="M 85 40 L 190 40 L 180 68 L 148 68 L 114 166 L 82 166 L 116 68 L 75 68 Z" fill="${fillT}" ${strokeAttr} />
  `;

  const wordmark = showWordmark ? `
    <g transform="translate(200, 220)" text-anchor="middle">
      <text font-family="'Sora', 'Inter', sans-serif" font-weight="900" font-size="34" letter-spacing="6" fill="${fillE}">EXTRA<tspan fill="${fillT}">TIME</tspan></text>
      <text y="24" font-family="'Rajdhani', sans-serif" font-weight="700" font-size="11" letter-spacing="8" fill="#848487">PLAY • COMPETE • CONNECT</text>
    </g>
  ` : '';

  const bgRect = bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}" rx="30" />` : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" opacity="${opacity}">
  ${defs}
  ${bgRect}
  <g ${filterAttr}>
    <g transform="${transform}">
      ${eShape}
      ${tShape}
    </g>
    ${wordmark}
  </g>
</svg>`;
}

const VARIANTS = [
  'primary',
  'monochrome-white',
  'monochrome-black',
  'metallic-silver',
  'metallic-gold',
  'brushed-steel',
  'embossed',
  'debossed',
  'glass',
  'holographic-foil',
  'minimal-outline',
  'icon-only',
  'watermark',
  'micro-16px',
  'card-badge',
  'favicon',
];

const SIZES = [16, 20, 24, 32, 48, 64, 96, 128, 256, 512, 1024, 2048];

async function generateAllAssets() {
  console.log('Generating ExtraTime Official Logo System Assets...');

  for (const variant of VARIANTS) {
    const isIconOnly = ['icon-only', 'micro-16px', 'card-badge', 'favicon'].includes(variant);
    const aspectW = isIconOnly ? 200 : 400;
    const aspectH = isIconOnly ? 200 : 300;

    // 1. Generate Master SVG
    const masterSvg = getLogoSvg({ variant, width: aspectW, height: aspectH });
    const masterSvgPath = path.join(OUTPUT_DIR, `et-logo-${variant}.svg`);
    fs.writeFileSync(masterSvgPath, masterSvg);

    // 2. Export across all required sizes
    for (const size of SIZES) {
      const h = Math.round(size * (aspectH / aspectW));
      const svgResized = getLogoSvg({ variant, size, width: size, height: h });

      // PNG transparent
      const pngPath = path.join(OUTPUT_DIR, `et-logo-${variant}-${size}x${h}.png`);
      await sharp(Buffer.from(svgResized))
        .resize(size, h)
        .png()
        .toFile(pngPath);

      // WebP transparent
      const webpPath = path.join(OUTPUT_DIR, `et-logo-${variant}-${size}x${h}.webp`);
      await sharp(Buffer.from(svgResized))
        .resize(size, h)
        .webp()
        .toFile(webpPath);
    }
  }

  // Generate Favicon ICO & root copy
  const faviconSvg = getLogoSvg({ variant: 'favicon', width: 32, height: 32 });
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'favicon.ico'));

  await sharp(Buffer.from(faviconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(process.cwd(), 'public', 'ExtraTimeLogo.png'));

  console.log('✅ Successfully generated all logo system assets in public/logos/!');
}

generateAllAssets().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
