// Sim Company Console - Cloudflare Worker.
// ONE canonical state doc lives in KV. The agent fires small events after each real action;
// the worker reduces them into the canonical state. Timer completion is DERIVED at read time,
// so a finished run flips to "done - needs next step" without any push.
import HTML from './site.html';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function readState(kv) {
  return JSON.parse((await kv.get('state')) || '{}');
}
async function writeState(kv, s) {
  s.ts = new Date().toISOString();
  await kv.put('state', JSON.stringify(s));
  return s;
}

// Derivation: runs that ended become "done"; actions tied to them flip; gaps get flagged; a next-move is derived.
function derive(s) {
  const now = Date.now();
  const expired = [];
  if (s.buildings) for (const b of s.buildings) {
    if (b.timer) {
      const ends = Date.parse(b.timer.endsAt);
      if (ends <= now) {
        b.derived = 'done';
        expired.push({ name: b.name, label: b.timer.label || b.status });
      } else if (b.timer.startsAt) {
        const t0 = Date.parse(b.timer.startsAt);
        b.derived = 'running';
        b.progress = Math.max(0, Math.min(1, (now - t0) / (ends - t0)));
        if (/store|retail|market/i.test(b.name) && ends - now < 90 * 60_000) b.derived = 'ending-soon';
      }
    }
  }
  // gap check: stores ending within 90 min but no warehouse stock behind them
  const gaps = [];
  const sellable = (s.inventory || []).filter(i => /apple|orange|grape|fruit/i.test(i.name) && !/shelf|display/i.test(i.name));
  const stockQty = sellable.reduce((a, i) => a + (i.qty || 0), 0);
  if (s.buildings && s.buildings.length) {
    const storesEnding = s.buildings.filter(b => /store/i.test(b.name) && b.timer && Date.parse(b.timer.endsAt) > now && Date.parse(b.timer.endsAt) - now < 90 * 60_000);
    if (storesEnding.length && stockQty < storesEnding.length * 200) {
      gaps.push(`Shelves empty soon (${storesEnding.map(b => b.name).join(', ')}) but warehouse has only ${stockQty} units of sellable fruit — buy before they clear.`);
    }
  }
  let actions = s.actions || [];
  if (expired.length) {
    actions = actions.map(a => {
      const hit = expired.some(e => e.label && (a.text || '').toLowerCase().includes(e.label.toLowerCase().split(' ')[0]));
      return hit && a.status === 'doing' ? { ...a, status: 'done' } : a;
    });
  }
  const firstQueued = (actions.find(a => a.status === 'queued') || {}).text;
  let next = s.next || null;
  if (gaps.length) next = 'GAP ALERT — ' + gaps.join(' ') + (firstQueued ? ' Then: ' + firstQueued : '');
  else if (expired.length) next = 'Just finished: ' + expired.map(e => `${e.name} (${e.label})`).join(', ') + ' — do the next step now.' + (firstQueued ? ' Then: ' + firstQueued : '');
  return { ...s, actions, derived: { expired, gaps, next } };
}

function applyEvent(s, ev) {
  s = s || { buildings: [], inventory: [], actions: [], plan: [], history: [] };
  switch (ev.type) {
    case 'upsert_building': {
      const b = ev.building;
      const i = s.buildings.findIndex(x => x.name === b.name);
      if (i >= 0) s.buildings[i] = { ...s.buildings[i], ...b };
      else s.buildings.push(b);
      break;
    }
    case 'inventory_set': s.inventory = ev.items; break;
    case 'top': s.top = { ...(s.top || {}), ...ev.top }; break;
    case 'now': s.now = ev.text; break;
    case 'next': s.next = ev.text; break;
    case 'plan': s.plan = ev.plan; break;
    case 'cards': s.cards = ev.cards; break;
    case 'store': s.store = { ...(s.store || {}), ...ev.store }; break;
    case 'prices': s.prices = ev.prices; break;
    case 'actions_set': s.actions = ev.actions; break;
    case 'complete_action': {
      const q = (ev.text || '').toLowerCase();
      s.actions = (s.actions || []).map(a =>
        a.status === 'doing' && (a.text || '').toLowerCase().includes(q) ? { ...a, status: 'done' } : a);
      break;
    }
    case 'history': s.history = [...(s.history || []), ev.point].slice(-240); break;
    default: throw new Error('unknown event ' + ev.type);
  }
  return s;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const kv = env.CONSOLE;
    const agent = () => request.headers.get('x-agent-token') === env.AGENT_TOKEN;

    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(HTML, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    if (request.method === 'GET') {
      if (url.pathname === '/api/state') return json(derive(await readState(kv)));
      if (url.pathname === '/api/log') return new Response((await kv.get('log')) || '', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
      if (url.pathname === '/api/cmdlog') return json(JSON.parse((await kv.get('cmdlog')) || '[]'));
    }

    if (url.pathname === '/api/command' && request.method === 'POST') {
      const text = ((await request.json().catch(() => ({}))) || {}).text;
      if (!text || !String(text).trim()) return json({ ok: false }, 400);
      const cmds = JSON.parse((await kv.get('cmds')) || '[]');
      if (cmds.length > 50) return json({ ok: false, error: 'queue full' }, 429);
      cmds.push({ id: Date.now() + ':' + Math.random().toString(36).slice(2, 7), text: String(text).trim(), at: new Date().toISOString() });
      await kv.put('cmds', JSON.stringify(cmds.slice(-50)));
      return json({ ok: true });
    }

    if (request.method === 'POST' && agent()) {
      if (url.pathname === '/api/agent/event' || url.pathname === '/api/agent/events') {
        const body = await request.json();
        const evs = Array.isArray(body) ? body : (body.events || [body]);
        let s = await readState(kv);
        for (const ev of evs) s = applyEvent(s, ev);
        await writeState(kv, s);
        return json({ ok: true, version: s.ts });
      }
      if (url.pathname === '/api/agent/seed') {
        const body = await request.json();
        await writeState(kv, body.state);
        if (typeof body.log === 'string') await kv.put('log', body.log);
        return json({ ok: true });
      }
      if (url.pathname === '/api/agent/logline') {
        const body = await request.json();
        const cur = (await kv.get('log')) || '';
        await kv.put('log', (cur ? cur + '\n' : '') + (body.text || '').trim());
        return json({ ok: true });
      }
      if (url.pathname === '/api/agent/claim') {
        const cmds = JSON.parse((await kv.get('cmds')) || '[]');
        await kv.put('cmds', '[]');
        const log = JSON.parse((await kv.get('cmdlog')) || '[]');
        for (const c of cmds) log.push({ text: c.text, at: c.at, status: 'sent' });
        await kv.put('cmdlog', JSON.stringify(log.slice(-100)));
        return json({ ok: true, commands: cmds });
      }
    }

    return new Response('nope', { status: 404 });
  },
};
