// SimCompanies price puller (official public API, GET only).
// Rules from the game's own API guide: GET only, at most 1 request/minute per endpoint.
// Usage: node tools/market.mjs [table|json]   (cached 60s)
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const cache = join(dir, 'ticker-cache.json');

const NAMES = {
  1: 'Power', 2: 'Water', 3: 'Apples', 4: 'Oranges', 5: 'Grapes', 6: 'Grain', 7: 'Tools',
  9: 'Eggs', 10: 'Beef', 12: 'Diesel', 13: 'Transport', 14: 'Minerals', 16: 'Silicon', 18: 'Chemicals',
  20: 'Processors', 24: 'Smart phones', 25: 'Tablets', 33: 'Breeding research', 40: 'Cotton',
  43: 'Steel', 66: 'Seeds', 72: 'Coffee beans', 75: 'Cocoa', 102: 'Bricks', 107: 'Steel beams',
  111: 'Construction units', 112: 'Bulldozer', 118: 'Coffee beans', 120: 'Fodder', 133: 'Flour',
  139: 'Software', 145: 'Software', 146: 'Recipes', 114: 'Steel', 115: 'Iron ore', 116: 'Aluminium',
};

// retail reference points observed from our grocery store page (avg price + demand)
const RETAIL = {
  3: { name: 'Apples', avg: 5.27, demand: 'low' },
  4: { name: 'Oranges', avg: 6.09, demand: 'low' },
  5: { name: 'Grapes', avg: 7.12, demand: 'low' },
  9: { name: 'Eggs', avg: 2.27, demand: 'very low' },
};

async function pull() {
  const cacheAge = (() => { try { return Date.now() - JSON.parse(readFileSync(cache, 'utf8')).at; } catch { return Infinity; } })();
  if (cacheAge < 60_000) return JSON.parse(readFileSync(cache, 'utf8'));
  const r = await fetch('https://www.simcompanies.com/api/v3/market-ticker/0/');
  if (!r.ok) throw new Error('ticker HTTP ' + r.status + ' (rate limited? wait 60s)');
  const raw = JSON.parse(await r.text());
  const data = { at: Date.now(), prices: raw.map(x => ({ kind: x.kind, name: NAMES[x.kind] || x.image?.split('/').pop(), price: x.price, is_up: x.is_up })) };
  writeFileSync(cache, JSON.stringify(data, null, 1));
  return data;
}

const d = await pull();
const interesting = [3, 4, 5, 6, 7, 66, 2, 1, 13, 9];
const rows = d.prices.filter(p => interesting.includes(p.kind));
const lines = [];
for (const p of rows) {
  const ret = RETAIL[p.kind];
  const margin = ret ? (ret.avg - p.price).toFixed(2) : null;
  lines.push(`${(p.name || '').padEnd(18)} buy $${String(p.price).padEnd(8)} ${ret ? `retail avg $${ret.avg}  margin $${margin}/unit (${ret.demand})` : ''}`);
}
console.log(new Date(d.at).toLocaleTimeString(), '| retail-flip margins (store avg - exchange buy):');
console.log(lines.join('\n'));
