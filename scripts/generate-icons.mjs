import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Chef hat SVG on terracotta circle
function makeSvg(size) {
  const pad = size * 0.15;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Chef hat centered in the circle
  const hatW = size * 0.5;
  const hatH = size * 0.45;
  const hatX = cx - hatW / 2;
  const hatY = cy - hatH / 2 - size * 0.02;

  // Hat proportions
  const bandH = hatH * 0.2;
  const bandY = hatY + hatH - bandH;
  const puffY = hatY;
  const puffH = hatH - bandH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#C4622D"/>
  <!-- Chef hat band -->
  <rect x="${hatX}" y="${bandY}" width="${hatW}" height="${bandH}" rx="${bandH * 0.15}" fill="white"/>
  <!-- Chef hat puff (three overlapping circles) -->
  <ellipse cx="${cx}" cy="${puffY + puffH * 0.55}" rx="${hatW * 0.38}" ry="${puffH * 0.55}" fill="white"/>
  <ellipse cx="${cx - hatW * 0.25}" cy="${puffY + puffH * 0.6}" rx="${hatW * 0.28}" ry="${puffH * 0.48}" fill="white"/>
  <ellipse cx="${cx + hatW * 0.25}" cy="${puffY + puffH * 0.6}" rx="${hatW * 0.28}" ry="${puffH * 0.48}" fill="white"/>
</svg>`;
}

for (const size of [192, 512]) {
  const svg = Buffer.from(makeSvg(size));
  await sharp(svg).resize(size, size).png().toFile(join(outDir, `icon-${size}.png`));
  console.log(`Created icon-${size}.png`);
}

// Also save the SVG version
import { writeFileSync } from "fs";
writeFileSync(join(outDir, "icon.svg"), makeSvg(512));
console.log("Created icon.svg");
