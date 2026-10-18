// Computes each sprite's non-transparent bounding box (for iso anchoring) -> assets/offsets.json
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const out = {};
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.png')) continue;
  const buf = readFileSync(join(dir, f));
  if (buf[12] !== 0x49) continue; // not png
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  const colorType = buf[25], bitDepth = buf[24];
  if (bitDepth !== 8) { out[f] = { w, h, note: 'bitdepth ' + bitDepth }; continue; }
  // chunks
  let idat = [], plte = null, trns = null, pos = 8;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    else if (type === 'PLTE') plte = buf.subarray(pos + 8, pos + 8 + len);
    else if (type === 'tRNS') trns = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const px = colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 4 ? 2 : colorType === 6 ? 4 : 0;
  if (!px) { out[f] = { w, h, note: 'colortype ' + colorType }; continue; }
  const stride = w * px;
  const img = Buffer.alloc(stride * h);
  // unfilter
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const rowIn = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = img.subarray(y * stride, (y + 1) * stride);
    const bpp = px;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = y > 0 ? img[(y - 1) * stride + x] : 0, c = (x >= bpp && y > 0) ? img[(y - 1) * stride + x - bpp] : 0;
      let v = rowIn[x];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + b) & 255;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (ft === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
      row[x] = v;
    }
  }
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  const opaque = (i) => {
    if (colorType === 6) return img[i * 4 + 3] > 8;
    if (colorType === 4) return img[i * 2 + 1] > 8;
    if (colorType === 3) return trns ? (trns[img[i]] ?? 255) > 8 : true;
    return true;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (opaque(y * w + x)) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  out[f] = { w, h, x0, x1, y0, y1 };
}
writeFileSync(join(dir, 'offsets.json'), JSON.stringify(out, null, 1));
console.log('done', Object.keys(out).length);
