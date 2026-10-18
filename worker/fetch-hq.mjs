// fetch all HQ landmark variants + market candidates for visual pick
import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'assets');
const pairs = JSON.parse(readFileSync(join(dir, 'assets-manifest.json'), 'utf8'));
const byName = new Map(pairs.map(p => [p.name, p.file]));
const want = [
  'images/landscape/hq/hq-vintage.png','images/landscape/hq/hq-golf.png','images/landscape/hq/hq-golf2.png',
  'images/landscape/hq/hq-ariake.png','images/landscape/hq/hq-obsidian.png','images/landscape/hq/hq-lvl16corrected.png',
  'images/landscape/hq/hq-lvl-high.png','images/landscape/hq/hq-green-tower.png','images/landscape/hq/hq-uk-bell-tower.png',
  'images/buildings/other/hq_banana.png','images/buildings/other/hq_aerospace.png','images/buildings/other/hq_electronics.png',
  'images/buildings/other/hq_industrial_resources.png','images/buildings/other/hq_atc_tower.png','images/buildings/other/hq_mosque.png',
  'images/buildings/other/hq_frozen.png','images/buildings/other/hq_summer.png','images/buildings/other/hq_disco_nuke.png',
  'images/landscape/beach-market-lvl1.png','images/landscape/estore-lvl1.png','images/landscape/hardware-store-lvl1.png',
];
for (const name of want) {
  const f = byName.get(name);
  if (!f) { console.log(name, 'NOT IN MANIFEST'); continue; }
  const r = await fetch('https://www.simcompanies.com/static/' + f);
  if (!r.ok) { console.log(name, r.status); continue; }
  const buf = Buffer.from(await r.arrayBuffer());
  const isPng = buf[12] === 0x49 && buf[13] === 0x48;
  if (!isPng) { console.log(name, 'not png'); continue; }
  writeFileSync(join(dir, 'c-' + name.split('/').pop()), buf);
  console.log('c-' + name.split('/').pop(), buf.length);
}
