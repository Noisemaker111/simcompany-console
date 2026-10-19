// Seeds the Worker's canonical state with current verified game truth. Run: node tools/seed.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const workerDir = join(dir, '..', 'worker');
const token = readFileSync(join(workerDir, 'agent-token.txt'), 'utf8').trim();
const U = 'https://simcompany-console.jk10192000.workers.dev';

const now = new Date();
const at = (h, m) => { const d = new Date(now); d.setHours(h, m, 0, 0); if (d <= now) d.setDate(d.getDate() + 1); return d.toISOString(); };

const state = {
  ts: now.toISOString(),
  top: { cash: '$5,091', credits: '10', level: 'Lv 4 (40%)' },
  cards: [
    { label: 'Cash', value: '$5,091', sub: '250 apples stocked for the 10:30 shelf gap' },
    { label: 'Level', value: '4 (40%)', sub: 'level 5 = free building slot + 24hr orders' },
    { label: 'Stores', value: '2 selling', sub: 'oranges clear ~10:30/10:37' },
    { label: 'Farms', value: '2 cooking', sub: '4hr seeds runs — 21,340 seeds done 1:36 AM' },
    { label: 'Credits', value: '10', sub: '50 needed for land unlock' },
    { label: 'Buildings', value: '4 built', sub: '2 farms + 2 grocery stores' }
  ],
  buildings: [
    { name: 'Farm #1', level: 1, status: '4hr seeds run — 10,670 seeds', timer: { startsAt: at(21, 37), endsAt: at(1, 36), label: '4hr seeds run (10,670 seeds)' } },
    { name: 'Farm #2', level: 1, status: '4hr seeds run — 10,670 seeds', timer: { startsAt: at(21, 37), endsAt: at(1, 36), label: '4hr seeds run (10,670 seeds)' } },
    { name: 'Grocery store #1', level: 1, status: '250 oranges @ $6.17 · done ~10:30 PM', timer: { startsAt: at(21, 24), endsAt: at(22, 30), label: '250 oranges shelf' } },
    { name: 'Grocery store #2', level: 1, status: '250 oranges @ $6.17 · done ~10:37 PM', timer: { startsAt: at(21, 24), endsAt: at(22, 37), label: '250 oranges shelf' } },
    { name: 'Company HQ', level: 1, status: 'running' },
    { name: 'Locked land parcel', level: 0, status: 'UNLOCK 50 credits', state: 'idle' }
  ],
  inventory: [
    { name: 'Apples', qty: 250, unit: '$2.54' },
    { name: 'Water', qty: 6700, unit: '$0.35' },
    { name: 'Power', qty: 5000, unit: '$0.24' },
    { name: 'Transport', qty: 2000, unit: '$0.35' },
    { name: 'Seeds', qty: 0, unit: '$0.28' }
  ],
  store: { Shelf: '250 oranges each store (clears ~10:30)', 'Next stock': '250 apples in warehouse ready', 'Price plan': 'AVG PRICE' },
  prices: [
    { name: 'Apples', bid: '$2.45', ask: 'retail $5.30 → margin $2.19/u' },
    { name: 'Oranges', bid: '$2.55', ask: 'retail $6.17 → margin $3.07/u' },
    { name: 'Grapes', bid: '$2.95', ask: 'retail $7.16 → margin $4.17/u' },
    { name: 'Seeds', bid: null, ask: '$0.28' },
    { name: 'Water', bid: null, ask: '$0.35' },
    { name: 'Construction units', bid: null, ask: '$2,470 avg' }
  ],
  actions: [
    { text: 'Built Farm #2 + Grocery store #2; $22,150 collected from banners today', status: 'done' },
    { text: 'Level 4 reached (40%) — free slot at level 5', status: 'done' },
    { text: 'Bridge stock bought: 250 apples (oranges went on shelves)', status: 'done' },
    { text: 'Store #1: 250 oranges, done ~10:30 PM', status: 'doing' },
    { text: 'Store #2: 250 oranges, done ~10:37 PM', status: 'doing' },
    { text: 'Farms: 4hr seeds runs, 21,340 seeds done 1:36 AM', status: 'doing' },
    { text: '10:30 PM: store #1 -> stock 250 apples @ AVG; rebuy oranges', status: 'queued' },
    { text: '10:37 PM: store #2 -> stock next cycle (oranges/grapes by margin)', status: 'queued' },
    { text: '1:36 AM: 21,340 seeds done -> plan morning apple runs', status: 'queued' }
  ],
  now: 'Overnight machine is set: both farms on 4hr seeds runs (21,340 seeds by 1:36 AM), both stores selling 250 oranges until ~10:30. 250 apples wait in the warehouse to restock the first empty shelf.',
  next: '10:30 PM: store #1 clears -> shelve the 250 warehouse apples, then rebuy oranges for store #2.',
  plan: [
    'Tonight: shelves keep rotating until the seeds runs end (1:36 AM)',
    'Buyer $30k tier -> $5,000; Employer 600 workers -> $6,000',
    'Builder 5/5 -> $7,500 (needs 50-credit land unlock)',
    'Level 5 = free building slot + 24hr orders',
    'Water reservoir at cash > $22k (farm input independence)',
    'Forever goal: Construction factory $72k -> units @ $2,440/u'
  ],
  history: [
    { t: '17:35', cash: 530, water: 0, power: 0, transport: 0, seeds: 115, apples: 0 },
    { t: '17:47', cash: 355, water: 500, power: 0, transport: 0, seeds: 115, apples: 0 },
    { t: '17:54', cash: 180, water: 350, power: 0, transport: 0, seeds: 115, apples: 35 },
    { t: '18:41', cash: 421, water: 350, power: 10000, transport: 5000, seeds: 1615, apples: 0 },
    { t: '18:54', cash: 111, water: 10100, power: 10000, transport: 5000, seeds: 115, apples: 0 },
    { t: '18:56', cash: 1258, water: 10100, power: 5000, transport: 5000, seeds: 115, apples: 0 },
    { t: '18:58', cash: 2257, water: 10100, power: 5000, transport: 2000, seeds: 115, apples: 0 },
    { t: '19:05', cash: 2635, water: 8900, power: 5000, transport: 2000, seeds: 636, apples: 0 },
    { t: '19:20', cash: 2072, water: 8900, power: 5000, transport: 2000, seeds: 636, apples: 0 },
    { t: '19:35', cash: 7021, water: 8800, power: 5000, transport: 2000, seeds: 636, apples: 0 },
    { t: '21:25', cash: 8241, water: 8800, power: 5000, transport: 2000, seeds: 0, apples: 212 },
    { t: '22:00', cash: 5091, water: 6700, power: 5000, transport: 2000, seeds: 0, apples: 250 }
  ]
};

const r = await fetch(U + '/api/agent/seed', {
  method: 'POST',
  headers: { 'x-agent-token': token, 'content-type': 'application/json' },
  body: JSON.stringify({ state, log: readFileSync(join(dir, '..', 'log.txt'), 'utf8') }),
});
console.log('seed:', JSON.stringify(await r.json()));
