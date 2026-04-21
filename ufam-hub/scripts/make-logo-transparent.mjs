#!/usr/bin/env node
/**
 * Remove fundo preto (quase) sólido dos PNG da marca em /public,
 * gravando PNG com alpha real (transparente).
 *
 * Ajusta THRESH se o chapéu escuro desaparecer: subir ligeiramente (ex.: 22).
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const files = ["logo-dark.png", "logo-light.png"];

/** Pixel considerado “fundo” se R,G,B ≤ threshold (0–255). */
const THRESH = 18;

async function processFile(name) {
  const inputPath = join(publicDir, name);
  let input;
  try {
    input = readFileSync(inputPath);
  } catch {
    console.warn(`[make-logo-transparent] Ignorado (não existe): ${name}`);
    return;
  }

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`Esperado RGBA, obtido ${channels} canais`);
  }

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r <= THRESH && g <= THRESH && b <= THRESH) {
      data[i + 3] = 0;
    }
  }

  const out = await sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  writeFileSync(inputPath, out);
  console.log(`[make-logo-transparent] OK ${name} (${width}×${height})`);
}

for (const f of files) {
  await processFile(f);
}
