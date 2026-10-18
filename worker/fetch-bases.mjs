// bases (sidewalk-on-grass?) + grocery idle tier1
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const pairs = JSON.parse(readFileSync(join(dir, 'assets-manifest.json'), 'utf8'));
const byName = new Map(pairs.map(p => [p.name, p.file]));
const want = [];
for (const b of ['1100','0110','0001','1111','1001','0010','1000','0100','0011'])
  want.push({ n: `images/landscape/decorations/bases/concrete-${b}.png`, o: `base-${b}.png` });
want.push({ n: 'images/buildings/sales/grocery_store_idle_tier01.png', o: 'c-grocery-idle-t1.png' });
for (const w of want) {
  const f = byName.get(w.n);
  if (!f) { console.log(w.o, 'NOT IN MANIFEST'); continue; }
  const r = await fetch('https://www.simcompanies.com/static/' + f);
  if (!r.ok) { console.log(w.o, r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(join(dir, w.o), buf);
  console.log(w.o, buf.length);
}
