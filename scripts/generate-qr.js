/**
 * OurMenu OS — Logo QR Generator v4 (FINAL SVG + Puppeteer)
 *
 * Uses SVG <text> with embedded Google Fonts CSS. 
 * Converts to PNG using Puppeteer (Chrome) so the font renders perfectly
 * in the final PNG image.
 */

/* eslint-disable @typescript-eslint/no-require-imports, no-console, @typescript-eslint/no-unused-vars */
const QRCode    = require('qrcode');
const fs        = require('fs');
const path      = require('path');
const puppeteer = require('puppeteer');

// ─── Brand ────────────────────────────────────────────────────────────────────
const BRAND      = '#0f7b55';
const BRAND_DARK = '#095a3d';
const BRAND_DEEP = '#063d2a';
const WHITE      = '#ffffff';
const INK        = '#17201b';
const MUTED      = '#69746c';

// ─── Grid ─────────────────────────────────────────────────────────────────────
const M     = 22;   // px per module
const QUIET = 5;    // quiet zone in modules

async function generate() {
  const dir = path.dirname(require.main.filename);

  // ── QR matrix ────────────────────────────────────────────────────────────
  const qr   = await QRCode.create('https://ourmenuos.online', { errorCorrectionLevel: 'H' });
  const mods = qr.modules;
  const N    = mods.size;  // 29 for version 3

  const CANVAS = (N + QUIET * 2) * M;
  const ICON_R = CANVAS * 0.18;  // squircle corner radius

  const px = col => (col + QUIET) * M;
  const py = row => (row + QUIET) * M;

  const isFinder = (r, c) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const isTiming = (r, c) =>
    (r === 6 && c >= 6 && c <= N - 7) || (c === 6 && r >= 6 && r <= N - 7);

  // OM clear zone: 9×9 modules
  const OM_HALF = 4;
  const omCenterR = Math.floor(N / 2);
  const omCenterC = Math.floor(N / 2);
  const isOM = (r, c) =>
    Math.abs(r - omCenterR) <= OM_HALF && Math.abs(c - omCenterC) <= OM_HALF;

  const omCanvasCX = px(omCenterC) + M/2;
  const omCanvasCY = py(omCenterR) + M/2;

  // ── SVG defs & styling ───────────────────────────────────────────────────
  const defs = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;900&amp;display=swap');
      .om-text {
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        font-size: 88px; /* Reduced from 104px to add horizontal padding */
        fill: ${WHITE};
        text-anchor: middle;
        dominant-baseline: central;
      }
      .wm-our {
        font-family: 'Inter', sans-serif;
        font-weight: 300;
        fill: ${INK};
        letter-spacing: 0.5px;
      }
      .wm-menu {
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        fill: ${BRAND};
        letter-spacing: -1px;
      }
      .wm-tag {
        font-family: 'Inter', sans-serif;
        font-weight: 400;
        fill: ${MUTED};
        letter-spacing: 2.2px;
      }
    </style>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="${BRAND}"/>
      <stop offset="100%" stop-color="${BRAND_DEEP}"/>
    </linearGradient>
    <clipPath id="sq">
      <rect width="${CANVAS}" height="${CANVAS}" rx="${ICON_R}" ry="${ICON_R}"/>
    </clipPath>
  `;

  // ── White QR data modules ─────────────────────────────────────────────────
  const PAD = 1.5;
  const DR  = M * 0.40;
  let modules = '';
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isFinder(r, c) || isOM(r, c) || !mods.get(r, c)) continue;
      const x   = px(c), y = py(r);
      const rad = isTiming(r, c) ? 2 : DR;
      modules  += `<rect x="${x+PAD}" y="${y+PAD}" width="${M-PAD*2}" height="${M-PAD*2}" rx="${rad}" fill="${WHITE}" opacity="0.95"/>`;
    }
  }

  // ── Finder squares ────────────────────────────────────────────────────────
  const FR = M * 0.55;
  const finder = (startR, startC) => {
    const x = px(startC), y = py(startR);
    const outer = 7 * M, gap = M, inner = 3 * M;
    return `
    <rect x="${x}"       y="${y}"       width="${outer}" height="${outer}" rx="${FR*1.8}" fill="${WHITE}"/>
    <rect x="${x+gap}"   y="${y+gap}"   width="${outer-gap*2}" height="${outer-gap*2}" rx="${FR*0.9}" fill="url(#bg)"/>
    <rect x="${x+gap*2}" y="${y+gap*2}" width="${inner}" height="${inner}" rx="${FR*0.5}" fill="${WHITE}"/>`;
  };
  const finders = finder(0,0) + finder(0,N-7) + finder(N-7,0);

  // OM Box and Text (optically tweaked slightly down)
  const boxSize = 8 * M; // 8x8 modules size to leave half a module gap to the QR data
  const boxR = boxSize * 0.22; // rounded squircle corners
  const omElement = `
    <rect x="${omCanvasCX - boxSize/2}" y="${omCanvasCY - boxSize/2}" 
          width="${boxSize}" height="${boxSize}" rx="${boxR}" 
          fill="none" stroke="${WHITE}" stroke-width="${M * 0.6}" />
    <text x="${omCanvasCX}" y="${omCanvasCY + 3}" class="om-text">OM</text>
  `;

  // ── ICON SVG ──────────────────────────────────────────────────────────────
  const iconSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <g clip-path="url(#sq)">
    <rect width="${CANVAS}" height="${CANVAS}" fill="url(#bg)"/>
    ${modules}
    ${finders}
    ${omElement}
  </g>
</svg>`;

  // ── LOGO LOCKUP ───────────────────────────────────────────────────────────
  const ICON_H    = CANVAS * 0.65;
  const ICON_SCALE = ICON_H / CANVAS;
  const PAD_OUTER = M * 2;
  const GAP       = M * 2.5;
  const WM_X      = PAD_OUTER + ICON_H + GAP;
  const FS_MAIN   = ICON_H * 0.22;
  const FS_TAG    = ICON_H * 0.085;
  const WM_CY     = (ICON_H + PAD_OUTER * 2) / 2;
  const LOGO_W    = WM_X + FS_MAIN * 4.6 + PAD_OUTER;
  const LOGO_H_PX = ICON_H + PAD_OUTER * 2;

  const wordmark = `
    <text x="${WM_X}" y="${WM_CY - FS_MAIN * 0.2}" font-size="${FS_MAIN}px" dominant-baseline="central">
      <tspan class="wm-our">Our</tspan><tspan class="wm-menu">Menu</tspan>
    </text>
    <text x="${WM_X}" y="${WM_CY + FS_MAIN * 0.52}" font-size="${FS_TAG}px" class="wm-tag">OURMENUOS.ONLINE</text>`;

  const logoSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${LOGO_W.toFixed(0)}" height="${LOGO_H_PX.toFixed(0)}"
     viewBox="0 0 ${LOGO_W.toFixed(0)} ${LOGO_H_PX.toFixed(0)}"
     xmlns="http://www.w3.org/2000/svg">
  <defs>${defs}</defs>
  <rect width="${LOGO_W.toFixed(0)}" height="${LOGO_H_PX.toFixed(0)}" fill="${WHITE}"/>
  <g transform="translate(${PAD_OUTER}, ${PAD_OUTER}) scale(${ICON_SCALE.toFixed(6)})">
    <g clip-path="url(#sq)">
      <rect width="${CANVAS}" height="${CANVAS}" fill="url(#bg)"/>
      ${modules}
      ${finders}
      ${omElement}
    </g>
  </g>
  ${wordmark}
</svg>`;

  const iconPath = path.join(dir, 'ourmenu-qr-icon.svg');
  const logoPath = path.join(dir, 'ourmenu-qr-logo.svg');
  fs.writeFileSync(iconPath, iconSVG);
  fs.writeFileSync(logoPath, logoSVG);

  console.log(`\n✅ SVGs written.`);
  console.log(`   Launching Puppeteer to render PNGs with exact fonts...`);

  // ── Render PNGs via Puppeteer ─────────────────────────────────────────────
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  async function renderSvgToPng(svgString, outputPath, baseWidth, baseHeight, targetSize) {
    const scale = targetSize / baseWidth;
    const page = await browser.newPage();
    await page.setViewport({ width: Math.round(baseWidth), height: Math.round(baseHeight), deviceScaleFactor: scale });
    
    // Load SVG into browser ensuring fonts are fetched
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>body { margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
      </head>
      <body>
        ${svgString}
      </body>
      </html>
    `;
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const svgElement = await page.$('svg');
    await svgElement.screenshot({ path: outputPath, omitBackground: true });
    await page.close();
    console.log(`   -> ${path.basename(outputPath)} (${Math.round(baseWidth * scale)}x${Math.round(baseHeight * scale)})`);
  }

  // Logo lockup sizes
  await renderSvgToPng(logoSVG, path.join(dir, 'ourmenu-qr-logo.png'), LOGO_W, LOGO_H_PX, LOGO_W * 2); // 2x standard
  await renderSvgToPng(logoSVG, path.join(dir, 'ourmenu-qr-logo-4k.png'), LOGO_W, LOGO_H_PX, 3840); // 4k width

  // Icon / App sizes
  await renderSvgToPng(iconSVG, path.join(dir, 'ourmenu-qr-icon.png'), CANVAS, CANVAS, CANVAS * 2); // 2x standard
  await renderSvgToPng(iconSVG, path.join(dir, 'ourmenu-qr-icon-4k.png'), CANVAS, CANVAS, 3840); // 4k width
  
  // PWA and Web sizes
  await renderSvgToPng(iconSVG, path.join(dir, 'icon-512x512.png'), CANVAS, CANVAS, 512);
  await renderSvgToPng(iconSVG, path.join(dir, 'icon-192x192.png'), CANVAS, CANVAS, 192);
  await renderSvgToPng(iconSVG, path.join(dir, 'apple-touch-icon.png'), CANVAS, CANVAS, 180);
  await renderSvgToPng(iconSVG, path.join(dir, 'favicon-32x32.png'), CANVAS, CANVAS, 32);
  await renderSvgToPng(iconSVG, path.join(dir, 'favicon-16x16.png'), CANVAS, CANVAS, 16);

  await browser.close();
  console.log(`✅ PNGs rendered perfectly with Chrome.`);
}

generate().catch(err => { console.error('\n❌', err.message); process.exit(1); });
