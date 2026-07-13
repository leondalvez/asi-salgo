import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = join(__dirname, '..', '..', 'frontend', 'og-salida.svg');
const pngPath = join(__dirname, '..', '..', 'frontend', 'og-salida.png');

const svg = readFileSync(svgPath);

await sharp(svg, { density: 144 })
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

console.log('Generado:', pngPath);
