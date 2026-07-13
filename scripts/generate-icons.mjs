/**
 * Regenerates every raster icon from the single SVG source of truth.
 *
 *   src/app/icon.svg  ──┬─► src/app/favicon.ico   (16/32/48, simplified glyph)
 *                       ├─► src/app/apple-icon.png (180, full-bleed square)
 *                       └─► src/app/og-glyph.png   (256, embedded in the OG image)
 *
 * Run with `pnpm icons` after editing icon.svg. Committing the output keeps the
 * build free of an image-processing step.
 *
 * Two glyph variants exist on purpose: the corner dots, the catchlight and the
 * thin eye stroke read well at 180px+ but turn to mud at 16px, so the favicon is
 * rasterized from a chunkier, detail-free variant of the same drawing.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

// sharp ships with Next as an optional dependency (image optimization). Resolving
// it *through* next keeps this script dependency-free under pnpm's strict layout,
// where sharp is not hoisted to the project root.
const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next'))('sharp');

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'app');

const INK = '#111827'; // gray-900 — the app's fixed background
const LIGHT = '#C27AFF';
const DEEP = '#7E22CE';

/** Chunky, detail-free variant: legible down to 16x16. */
const smallGlyph = /* svg */ `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="g" x1="120" y1="120" x2="392" y2="392" gradientUnits="userSpaceOnUse">
            <stop stop-color="${LIGHT}" /><stop offset="1" stop-color="${DEEP}" />
        </linearGradient>
    </defs>
    <rect width="512" height="512" rx="96" fill="${INK}" />
    <path d="M76 256C156 120 356 120 436 256C356 392 156 392 76 256Z"
          fill="none" stroke="url(#g)" stroke-width="30" stroke-linejoin="round" />
    <circle cx="256" cy="256" r="68" fill="url(#g)" />
    <circle cx="256" cy="242" r="24" fill="${INK}" />
    <path d="M245 252L267 252L277 298L235 298Z" fill="${INK}" />
</svg>`;

/** Apple masks the icon itself, so ship it square and full-bleed (no radius). */
const squareGlyph = (source) => source.replace(/rx="112"/, 'rx="0"');

/**
 * The OG card already paints a dark gradient, so drop the tile and let the eye
 * float on it — keeping the tile reads as a sticker pasted on the background.
 */
const bareGlyph = (source) => source.replace(/<rect[^>]*fill="#111827"[^>]*\/>/, '');

/** Packs PNG buffers into an .ico container (PNG-compressed entries). */
function toIco(pngs) {
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type: icon
    header.writeUInt16LE(pngs.length, 4);

    let offset = 6 + pngs.length * 16;
    const entries = pngs.map(({ size, data }) => {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
        entry.writeUInt8(size >= 256 ? 0 : size, 1);
        entry.writeUInt8(0, 2); // palette
        entry.writeUInt8(0, 3); // reserved
        entry.writeUInt16LE(1, 4); // color planes
        entry.writeUInt16LE(32, 6); // bits per pixel
        entry.writeUInt32LE(data.length, 8);
        entry.writeUInt32LE(offset, 12);
        offset += data.length;
        return entry;
    });

    return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const render = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const source = await readFile(join(APP_DIR, 'icon.svg'), 'utf8');

const faviconSizes = [16, 32, 48];
const favicon = await Promise.all(
    faviconSizes.map(async (size) => ({ size, data: await render(smallGlyph, size) })),
);
await writeFile(join(APP_DIR, 'favicon.ico'), toIco(favicon));

await writeFile(join(APP_DIR, 'apple-icon.png'), await render(squareGlyph(source), 180));
await writeFile(join(APP_DIR, 'og-glyph.png'), await render(bareGlyph(source), 320));

console.log(`favicon.ico (${faviconSizes.join('/')}) · apple-icon.png (180) · og-glyph.png (320)`);
