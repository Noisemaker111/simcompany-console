// fetch candidate sprites for the exchange/market building + a few greens
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const pairs = JSON.parse(readFileSync(join(dir, 'assets-manifest.json'), 'utf8'));
const byName = new Map(pairs.map(p => [p.name, p.file]));
const want = [
  'images/landscape/beach-market-lvl1.png',
  'images/buildings/seasonal/pool_market_tier01.png',
  'images/buildings/production/farm_tier01.png',
];
for (const name of want) {
  const f = byName.get(name);
  if (!f) { console.log(name, 'NOT IN MANIFEST'); continue; }
  const r = await fetch('https://www.simcompanies.com/static/' + f);
  const buf = Buffer.from(await r.arrayBuffer());
  const out = name.split('/').pop().replace('.png', '');
  writeFileSync(join(dir, 'cand-' + out), buf);
  const isPng = buf[12] === 0x49 && buf[13] === 0x48;
  console.log(out, buf.length, isPng ? 'png' : 'other');
}
