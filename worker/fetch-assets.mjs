// Downloads the exact SimCompanies map sprites (via their public asset manifest) into ./assets
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(dir, 'assets');
mkdirSync(outDir, { recursive: true });

const BASE = 'https://www.simcompanies.com/static/';
const manifest = existsSync(join(outDir, 'manifest.json')) ? JSON.parse(readFileSync(join(outDir, 'assets-manifest.json'), 'utf8')) : null;
let pairs;
if (manifest) pairs = manifest.pairs;
else {
  const r = await fetch('https://www.simcompanies.com/static/bundle/assets/index-D8lEb2RC.js');
  const js = await r.text();
  pairs = [];
  for (const m of js.matchAll(/"(images\/[^"']+)":"(images\/[^"']+)"/g)) pairs.push({ name: m[1], file: m[2] });
  writeFileSync(join(outDir, 'assets-manifest.json'), JSON.stringify(pairs, null, 1));
}
const byName = new Map(pairs.map(p => [p.name, p.file]));

// tile bit pattern nnnn -> name bits: from listing, order seems (n?) assume year prefix combos 0000..1111
const bits = ['0000','1000','0100','1100','0010','1010','0110','1110','0001','1001','0101','1101','0011','1011','0111','1111'];
const W = (name, outName) => ({ url: BASE + name, out: outName });
const want = [];
for (const b of bits) want.push(W(`images/buildings/tiles/seasonal/concrete-summer-${b}.png`, `tile-${b}.png`));
for (const b of bits) want.push(W(`images/buildings/roads/seasonal/road-summer-${b.slice(2)}.png`, `road-${b.slice(2)}.png`));
for (const b of ['00','01','10']) want.push(W(`images/buildings/roads/seasonal/road-left-summer-${b}.png`, `road-left-${b}.png`));
want.push(W(`images/buildings/roads/seasonal/intersection-summer.png`, `road-intersection.png`));
for (const n of ['trees','residential4','residential11','residential21','residential31','park','plaza','intersection','truck','truck2','semi-truck','empty','empty2','concrete']) {
  want.push(W(`images/landscape/decorations/${n}.png`, `decor-${n}.png`));
}
for (const n of ['farm-lvl1','grocery2-lvl1','construction-factory-lvl1']) {
  want.push(W(`images/landscape/${n}.png`, `building-${n}.png`));
}
want.push(W(`images/buildings/decoration/construction_slot_01.png`, `building-construction_slot_01.png`));
want.push(W(`images/buildings/decoration/construction_slot_02.png`, `building-construction_slot_02.png`));
want.push(W(`images/buildings/other/hq_tier01.png`, `building-hq_tier01.png`));
want.push(W(`images/buildings/other/hq_tier02.png`, `building-hq_tier02.png`));
want.push(W(`images/buildings/other/exchange_tier02.png`, `building-exchange_tier02.png`));

const results = [];
for (const w of want) {
  const f = byName.get(w.url.replace(BASE, ''));
  if (!f) { results.push({ out: w.out, error: 'not in manifest' }); continue; }
  const r = await fetch(BASE + f);
  if (!r.ok) { results.push({ out: w.out, error: r.status }); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  // PNG IHDR dims
  let dims = 'webp?';
  if (buf[12] === 0x49 && buf[13] === 0x48) dims = `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
  writeFileSync(join(outDir, w.out), buf);
  results.push({ out: w.out, bytes: buf.length, dims });
}
console.log(JSON.stringify(results, null, 1));
