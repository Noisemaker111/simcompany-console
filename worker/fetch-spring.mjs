// fetch spring seasonal set + hq landmark + produce market
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'assets');
mkdirSync(dir, { recursive: true });
const pairs = JSON.parse(readFileSync(join(dir, 'assets-manifest.json'), 'utf8'));
const byName = new Map(pairs.map(p => [p.name, p.file]));
const want = [];
const bits = ['0000','1000','0100','1100','0010','1010','0110','1110','0001','1001','0101','1101','0011','1011','0111','1111'];
for (const b of bits) want.push({ n: `images/buildings/tiles/seasonal/concrete-spring-${b}.png`, o: `stile-${b}.png` });
for (const b of ['00','01','10']) {
  want.push({ n: `images/buildings/roads/seasonal/road-spring-${b}.png`, o: `sroad-${b}.png` });
  want.push({ n: `images/buildings/roads/seasonal/road-left-spring-${b}.png`, o: `sroad-left-${b}.png` });
}
want.push({ n: 'images/buildings/roads/seasonal/intersection-spring.png', o: 'sroad-intersection.png' });
want.push({ n: 'images/buildings/other/hq_spring.png', o: 'building-hqspring.png' });
want.push({ n: 'images/buildings/seasonal/spring_market_tier01.png', o: 'building-springmarket.png' });
for (const w of want) {
  const f = byName.get(w.n);
  if (!f) { console.log(w.o, 'NOT IN MANIFEST'); continue; }
  const r = await fetch('https://www.simcompanies.com/static/' + f);
  if (!r.ok) { console.log(w.o, 'HTTP', r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(join(dir, w.o), buf);
  console.log(w.o, buf.length);
}
